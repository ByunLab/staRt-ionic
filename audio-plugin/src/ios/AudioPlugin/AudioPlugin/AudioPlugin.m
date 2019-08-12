//
//  AudioPlugin.m
//  AudioPlugin
//
//  Created by Sam Tarakajian on 5/16/16.
//  Copyright © 2016 Girlfriends Labs. All rights reserved.
//

#import "AudioPlugin.h"
#import "APAudioManager.h"
#import "APLPCCalculator.h"
#import "LPCProfileDescription.h"
#import "LPCRecordingSession.h"

@interface AudioPlugin ()
@property (nonatomic, strong) APAudioManager *audioManager;
@end

@implementation AudioPlugin
- (void)pluginInitialize
{
    self.audioManager = [[APAudioManager alloc] init];
    NSLog(@"Initializing AudioPlugin, saving to dir %@", [LPCRecordingSession recordingDirectory]);
}

- (void)sendInvalidActionResultWithMessage:(NSString *)message command:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION
                                                messageAsString:message];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)startAudio:(CDVInvokedUrlCommand *)command
{
    [self.audioManager start];
}

- (void)stopAudio:(CDVInvokedUrlCommand *)command
{
    [self.audioManager stop];
}

- (void)getLPCCoefficients:(CDVInvokedUrlCommand *)command
{
    NSNumber *xScaleFactor = @(self.audioManager.lpcCalculator.frequencyScaling);
    NSDictionary *coefficientsDict = [self.audioManager.lpcCalculator fetchCurrentCoefficients];
    NSArray *audioCoefficients = [coefficientsDict objectForKey:@"coefficients"];
    NSArray *frequencyPeaks = [coefficientsDict objectForKey:@"peaks"];
    NSDictionary *resultDict = @{
                                 @"freqScale" : xScaleFactor,
                                 @"coefficients" : audioCoefficients,
                                 @"freqPeaks" : frequencyPeaks
                                 };
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                            messageAsDictionary:resultDict];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)startRecording:(CDVInvokedUrlCommand *)command
{
    if (self.audioManager.currentRecordingSession != nil) {
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION
                                                    messageAsString:@"Can't start recording--already recording"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
    
    LPCProfileDescription *description;
    NSDictionary *accountAsDict = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
	NSString *userString = [command argumentAtIndex:1 withDefault:@"" andClass:[NSString class]];
    NSString *recordingSessionId = [command argumentAtIndex:2 withDefault:@"INVALID-ID" andClass:[NSString class]];
    if (accountAsDict) {
        description = [LPCProfileDescription accountDescriptionWithDictionary:accountAsDict];
        LPCRecordingSession *session = [LPCRecordingSession
										sessionWithProfileDescription:description
										clientUserData:userString
                                        recordingSessionId:recordingSessionId];
        [self.audioManager startRecordingForRecordingSession:session];
        NSDictionary *recordingFiles = [session recordingFilesDictionary];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:recordingFiles];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    } else {
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION
                                                    messageAsString:@"Must pass valid JSON description of profile to record"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
}

- (void)stopRecording:(CDVInvokedUrlCommand *)command
{
    LPCRecordingSession *session = self.audioManager.currentRecordingSession;
    if (session) {
		[self.audioManager stopRecording];
        NSDictionary *recordingFiles = [session recordingFilesDictionary];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                                messageAsDictionary:recordingFiles];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    } else {
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION
                                                    messageAsString:@"Can't stop recording--no active recording session"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
}

- (void)isRecording:(CDVInvokedUrlCommand *)command
{
    LPCRecordingSession *session = self.audioManager.currentRecordingSession;
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:(session != nil)];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)recordingsForAccount:(CDVInvokedUrlCommand *)command
{
    LPCProfileDescription *description;
    NSDictionary *accountAsDict = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
    if (accountAsDict) {
        description = [LPCProfileDescription accountDescriptionWithDictionary:accountAsDict];
        NSArray *recordings = [LPCRecordingSession recordingsForAccount:description];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:recordings];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    } else {
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_INVALID_ACTION
                                                    messageAsString:@"Must pass valid JSON description of profile"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
}

- (void)deleteRecording:(CDVInvokedUrlCommand *)command
{
    NSDictionary *recordingAsDict = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
    if (!recordingAsDict) {
        [self sendInvalidActionResultWithMessage:@"Must pass valid JSON description of a recording" command:command];
        return;
    }
    
    NSString *metadataFile = [[recordingAsDict objectForKey:LPCRecordingSessionMetadataKey] lastPathComponent];
    LPCRecordingSession *session = [LPCRecordingSession sessionWithMetadataFile:metadataFile];
	if (session) {
		[session deleteFiles];
	}
	[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
								callbackId:command.callbackId];
	
    
}

- (void)deleteAllRecordings:(CDVInvokedUrlCommand *)command
{
    NSFileManager *manager = [NSFileManager defaultManager];
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    [manager removeItemAtPath:recordingDirectory error:nil];
	[self.commandDelegate sendPluginResult:[CDVPluginResult resultWithStatus:CDVCommandStatus_OK]
								callbackId:command.callbackId];
}

- (void)getLPCOrder:(CDVInvokedUrlCommand *)command
{
    NSInteger lpcOrder = self.audioManager.lpcCalculator.lpcOrder;
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsNSInteger:lpcOrder];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)setLPCOrder:(CDVInvokedUrlCommand *)command
{
    NSString *orderAsString = [command argumentAtIndex:0 withDefault:@"25" andClass:[NSString class]];
    NSInteger lpcOrder = [orderAsString integerValue];
    self.audioManager.lpcCalculator.lpcOrder = lpcOrder;
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsNSInteger:lpcOrder];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

@end
