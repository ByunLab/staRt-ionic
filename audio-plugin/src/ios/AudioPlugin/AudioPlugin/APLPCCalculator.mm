//
//  APLPCCalculator.m
//  AudioPlugin
//
//  Created by Sam Tarakajian on 5/19/16.
//  Copyright © 2016 Girlfriends Labs. All rights reserved.
//

#import "APLPCCalculator.h"
#import "AudioManager.h"
#import "LPCDisplayManager.h"
#import "LPCRecordingSession.h"
#import "LPCRecordingSessionData.h"
#import <AVFoundation/AVFoundation.h>
#include <mach/mach_time.h>

#define LPC_MIN (25)
#define LPC_MAX (45)
#define LPC_ORDER (40)                  /**< default number LPC coefficients */
#define LPC_NUM_DISPLAY_BINS (256)      /**< resolution of LPC magnitude spectrum */
#define MAX_NUM_TARG_FORMANTS (5)   /**< maximum number of LPC target formant frequencies */
#define NUM_LPC_DISPLAY_BINS (512)  /**< number of points in OpenGL structure used to draw LPC magnitude spectrum */
#define MAX_DISPLAY_FREQ (4500)     /**< upper limit of LPC magnitude spectrum display (Hz) */

//#define TEST_WITH_SIN_WAVE  1

@interface APLPCCalculator () <AEAudioReceiver> {
@public
    AudioManager *audioManager;
    Float32 sampleRate;
    LPCDisplayManager *lpcDisplayManager;
    FILE *m_lpcOutputFile;
    bool m_isRecording;
    
    Vector3 _freqVertices[NUM_LPC_DISPLAY_BINS];          /**< OpenGL vertices for drawing LPC magnitude spectrum */
    Vector3 _peakVertices[2*NUM_LPC_DISPLAY_BINS];        /**< OpenGL vertices for drawing peaks in LPC magnitude spectrum */
    Vector3 _targetFreqVertices[2*MAX_NUM_TARG_FORMANTS]; /**< OpenGL vertices containing points defining lines indicating target formant frequencies in LPC magnitude */
    
    double m_targetFormantFreqs[MAX_NUM_TARG_FORMANTS];       /**< array of target formant frequencies */
    
    double sinPhase;
    double _frequency;
}

@end

@implementation APLPCCalculator

static OSStatus WriteLPCCoefficients(__unsafe_unretained APLPCCalculator *THIS,
                                     const AudioTimeStamp  *inTimeStamp,
                                     UInt32                inNumberCoeffs,
                                     const double          *lpcCoefficients)
{
    static mach_timebase_info_data_t timeBaseInfo;
    static double time2nsFactor;
    if (timeBaseInfo.denom == 0) {
        (void) mach_timebase_info(&timeBaseInfo);
        time2nsFactor = (double) timeBaseInfo.numer / timeBaseInfo.denom;
        time2nsFactor /= pow(10, 9);
    }
    double timeStamp = (inTimeStamp->mHostTime * time2nsFactor);
    
    fprintf(THIS->m_lpcOutputFile, "%f,", timeStamp);
    for (UInt32 i=0; i<inNumberCoeffs; ++i) {
        if (i==inNumberCoeffs-1)
            fprintf(THIS->m_lpcOutputFile, "%f\n", lpcCoefficients[i]);
        else
            fprintf(THIS->m_lpcOutputFile, "%f,", lpcCoefficients[i]);
    }
    
    return 0;
}

- (id) initWithAudioController:(AEAudioController *)audioController
{
    self = [super init];
    if (self) {
        sampleRate = audioController.inputAudioDescription.mSampleRate;
        Float64 bufferDurationSecs = [[AVAudioSession sharedInstance] IOBufferDuration];
        UInt32 bufferLengthSamples = AEConvertSecondsToFrames(audioController, bufferDurationSecs);
        audioManager = new AudioManager(bufferLengthSamples, LPC_ORDER, NUM_LPC_DISPLAY_BINS, sampleRate);
        audioManager->enable_lpc_compute();
        lpcDisplayManager = new LPCDisplayManager(NUM_LPC_DISPLAY_BINS, sampleRate);
        _frequency = 22050.0 / 100.0;
    }
    return self;
}

- (NSDictionary *) fetchCurrentCoefficients
{
    // Get the LPC data
    int lpcSize = audioManager->m_lpc_magSpecResolution;  //audioManager->m_lpc_BufferSize;
    Float32 lpc_mag_buffer[lpcSize];
    memcpy(lpc_mag_buffer, audioManager->m_lpc_mag_buffer, lpcSize * sizeof(Float32));
    
    // set scaling so that specified maximum frequency is displayed
    float normFreq = 2.0 * MAX_DISPLAY_FREQ / sampleRate;
    float scaleX = 1.0 / normFreq;
    
    lpcDisplayManager->render(lpc_mag_buffer, _freqVertices, _peakVertices);
    lpcDisplayManager->renderTargetFormantFreqs(_targetFreqVertices, m_targetFormantFreqs, MAX_NUM_TARG_FORMANTS);
    
    // Write the freqency curve points
    NSMutableArray *coeffArray = [[NSMutableArray alloc] init];
    for (int i=0; i<lpcDisplayManager->_numDisplayBins; i++) {
        [coeffArray addObject:@(_freqVertices[i].y)];
    }
    
    // Write the peak points
    NSMutableArray *peakArray = [[NSMutableArray alloc] init];
    for (int i=0; i<lpcDisplayManager->_numDisplayBins; i++) {
        Vector3 *v = _peakVertices + i;
        if (v->x == 0.0 && v->y == 0.0)
            continue;
        CGPoint p = CGPointMake(v->x, v->y);
		CFDictionaryRef pr = CGPointCreateDictionaryRepresentation(p);
        [peakArray addObject:(__bridge NSDictionary *) pr];
		CFRelease(pr);
    }
    
    return @{@"coefficients":coeffArray, @"peaks":peakArray};
}

- (double) frequencyScaling
{
    float normFreq = 2.0 * MAX_DISPLAY_FREQ / sampleRate;
    float scaleX = 1.0 / normFreq;
    return scaleX;
}

static void receiverCallback(__unsafe_unretained APLPCCalculator *THIS,
                             __unsafe_unretained AEAudioController *audioController,
                             void *source,
                             const AudioTimeStamp *time,
                             UInt32 frames,
                             AudioBufferList *audio)
{
    Float32 *inA = (Float32 *)audio->mBuffers[0].mData;
    Float32 *inB = (Float32 *)audio->mBuffers[1].mData;
    
#ifdef TEST_WITH_SIN_WAVE
    Float64 sampleRate = 22050.0; //THIS->_sampleRate;
    Float32 freq = THIS->_frequency;
    // Get a pointer to the dataBuffer of the AudioBufferList
    //Float32 *outA = (Float32 *)ioData->mBuffers[0].mData;
    //Float32 *outB = (Float32 *)ioData->mBuffers[1].mData;
    
    // The amount the phase changes in  single sample
    double phaseIncrement = 2 * M_PI * freq / sampleRate;
    // Pass in a reference to the phase value, you have to keep track of this
    // so that the sin resumes right where the last call left off
    Float32 phase = THIS->sinPhase;
    
    double sinSignal;
    // Loop through the callback buffer, generating samples
    for (UInt32 i = 0; i < frames; ++i) {
        // calculate the next sample
        sinSignal = sin(phase);
        inA[i] = sinSignal;
        //outB[i] = sinSignal;
        phase = phase + phaseIncrement;
    }
    // Reset the phase value to prevent the float from overflowing
    if (phase >= 2 * M_PI * freq) {
        phase = phase - 2 * M_PI * freq;
    }
    // Store the phase for the next callback.
    THIS->sinPhase = phase;
    
    memcpy( THIS->audioManager->m_lpc_mag_buffer, inA, frames * sizeof(Float32));
    
#else
    THIS->audioManager->grabAudioData(inA);
    THIS->audioManager->computeLPC();
#endif
    
    if (THIS->m_isRecording) {
        WriteLPCCoefficients(THIS, time, THIS->audioManager->m_lpc_order, THIS->audioManager->m_lpc_coeffs);
    }
}

- (NSInteger) lpcOrder
{
    return self->audioManager->m_lpc_order;
}

- (void) setLpcOrder:(NSInteger)lpcOrder
{
    lpcOrder = MAX(MIN(lpcOrder, LPC_MAX), LPC_MIN);
    self->audioManager->setLPCOrder(lpcOrder);
}

- (void) writeMetadataFileForSessionData:(LPCRecordingSessionData *)sessionData error:(NSError *__autoreleasing *)error
{
	FILE *metadataFile = fopen(sessionData->metadata_path, "w");
	if (!metadataFile) {
		printf("LPCSessionRecorder: Could not open metadata file at path %s\n", sessionData->metadata_path);
		if (error)
			*error = [NSError errorWithDomain:@"LPCRecorder" code:-50 userInfo:nil];
		return;
	}
	
	const char *metadataHeader = "user_string, stream_sample_rate, uuid, email, deviceID, username, gender, age, heightFeet, heightInches, targetF3, stdevF3, targetLPCOrder, start_date, end_date, lpc_order, lpc_file, audio_file\n";
	fwrite(metadataHeader, sizeof(char), strlen(metadataHeader), metadataFile);
	fprintf(metadataFile,
			"%s, %f, %s, %s, %s, %s, %s, %d, %d, %d, %f, %f, %d, %s, %s, %d, %s, %s",
			sessionData->userDataString,
			sampleRate,
			sessionData->accountUUID,
			sessionData->accountEmail,
			sessionData->identifier,
			sessionData->username,
			sessionData->gender,
			sessionData->ageInYears,
			sessionData->heightFeet,
			sessionData->heightInches,
			sessionData->targetF3,
			sessionData->stdevF3,
			sessionData->targetLPCOrder,
			sessionData->date_string,
			sessionData->end_date_string,
			sessionData->lpc_order,
			sessionData->lpc_path,
			sessionData->audio_path);
	fclose(metadataFile);
}

- (void) beginRecordingLPCWithRecordingSessionData:(LPCRecordingSessionData *)sessionData error:(NSError *__autoreleasing *)error
{
	[self writeMetadataFileForSessionData:sessionData error:error];
	
    m_lpcOutputFile = fopen(sessionData->lpc_path, "w");
    if (!m_lpcOutputFile) {
        printf("LPCSessionRecorder: Could not open LPC file at path %s\n", sessionData->lpc_path);
        if (error)
            *error = [NSError errorWithDomain:@"LPCRecorder" code:-50 userInfo:nil];
        return;
    }
    fprintf(m_lpcOutputFile, "sample_time");
    for (int i=0; i<sessionData->lpc_order; ++i) {
        fprintf(m_lpcOutputFile, ",lpc_%d", i);
    }
    fprintf(m_lpcOutputFile, "\n");
    
    m_isRecording = true;
    
    if (error)
        *error = nil;
    return;
}

- (void) finishRecordingLPCWithRecordingSessionData:(LPCRecordingSessionData *)sessionData error:(NSError **)error
{
	[self writeMetadataFileForSessionData:sessionData error:error];
	
    m_isRecording = false;
    fclose(m_lpcOutputFile);
    m_lpcOutputFile = NULL;
}

-(AEAudioReceiverCallback)receiverCallback
{
    return receiverCallback;
}

@end
