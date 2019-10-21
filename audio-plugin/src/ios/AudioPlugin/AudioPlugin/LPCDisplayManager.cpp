/**
 * @file LPCDisplayManager.cpp
 * @Author Jon Forsyth
 * @date 7/25/14
 * @brief Classes and functions used for displaying LPC magnitude spectrum and spectral peaks.
 */

#include <iostream>
#include <cstdint>

#include "LPCDisplayManager.h"
#include "AudioManager.h"

#define LPC_HIST_LEN (16)        /**< number of buffers used for LPC magnitude spectrum history */
//#define LPC_NUM_DISPLAY_BINS (256)  // <-- this shouldn't need to change if sample rate is changed

#define MAX_DB_VAL (10.0)       /**< maximum level of LPC magnitude spectrum (dB) */
#define MIN_DB_VAL (-75.0)      /**< minimum level of LPC magnitude spectrum (dB) */


LPCDisplayManager::LPCDisplayManager(UInt32 numDisplayBins, Float32 sampleRate):
m_numPeaks(0)
{
    _numDisplayBins = numDisplayBins;
    m_sampleRate = sampleRate;
    
    // misc
    _displayPad = 0.1;
    
    // history buffer for smoothing out LPC magnitude computations
    _historyBuffer = new DoubleBuffer(_numDisplayBins,LPC_HIST_LEN);
    
    // Instance of Peaks and Valleys class
    peaksAndValleys = *new PeaksAndValleys();
}

LPCDisplayManager::~LPCDisplayManager()
{
    delete _historyBuffer;
}

void LPCDisplayManager::renderTargetFormantFreqs(Vector3 *targFreqVertices, double *targFormantFreqs, int maxNumTargFormantFreqs)
{
    memset(targFreqVertices, 0, maxNumTargFormantFreqs*sizeof(Vector3));
    float xPos = 0;
    
    for (int i=0; i<maxNumTargFormantFreqs; i++) {
        if (targFormantFreqs[i] == 0.0) {
            continue;
        }
        
        xPos =  this->getNormalizedFreq((Float32)targFormantFreqs[i]);
        
        targFreqVertices[2*i].x = xPos;
        targFreqVertices[2*i].y = 0.0;
        targFreqVertices[2*i].z = 0.0;
        //        targFormantFreqs[2*i].sceneColor = GLKVector4Make(1.0f, 1.0f, 1.0f, 1.0f);
        targFreqVertices[2*i+1].x = xPos;
        targFreqVertices[2*i+1].y = 1.0;
        targFreqVertices[2*i+1].z = 0.0;
    }
    
}

void LPCDisplayManager::render(Float32 *lpc_mag_buffer, Vector3 *freqVertices, Vector3 *peakVertices)
{
    float x_pos, y_pos;
    UInt32 peakIndices[_numDisplayBins];
    memset(peakIndices, 0, _numDisplayBins * sizeof(UInt32));
    
    // find average LPC mag values
    float avgLpc[_numDisplayBins];
    memset(avgLpc, 0, sizeof(float)*_numDisplayBins);
    
    _historyBuffer->writeBuffer(lpc_mag_buffer);
    _historyBuffer->averageAllBuffers(avgLpc);
    
    // Old peak detector
    //    findMaxima(avgLpc, _numDisplayBins, &peakIndices[0], &m_numPeaks);
    
    // New peaks detector
    if (!peaksAndValleys.initDisplayPtr){
        
        // Initialize all values and compute peaks and valleys for the incoming signal
        peaksAndValleys.displayInit(avgLpc, _numDisplayBins);
        peaksAndValleys.initDisplayPtr = true;
    }
    else if (peaksAndValleys.initDisplayPtr){
        
        // Reset all values and compute peaks and valleys for the incoming signal
        peaksAndValleys.resetValues(_numDisplayBins);
        peaksAndValleys.computeParams(avgLpc);
    }
    
    // Update peak indices
    for (int i = 0; i < peaksAndValleys.cntPeak; i++){
        peakIndices[i] += peaksAndValleys.peaks->idx[i];
    }
    
    // Update peak count
    m_numPeaks = peaksAndValleys.cntPeak;
    
    float mag;
    int pk_cnt = 0, curr_pk_idx;
    
    float min_y_pos = -1.0;
    
    memset(freqVertices,0,_numDisplayBins * sizeof(Vector3));
    memset(peakVertices, 0, m_numPeaks * sizeof(Vector3));
    
    for (int i=0; i<_numDisplayBins; i++) {
        // scale between -1.0 and 1.0
        x_pos = (2.0*(float)i / (float)(_numDisplayBins-1)) - 1.0;
        
        mag = (float)( 20.0 * log10(fabsf(avgLpc[i])+1e-20));
        
        if (mag > MAX_DB_VAL) mag = MAX_DB_VAL;
        if (mag < MIN_DB_VAL) mag = MIN_DB_VAL;
        
        y_pos = mag / ( MAX_DB_VAL - MIN_DB_VAL ); // + 1.0;
        
        freqVertices[i].x = x_pos;
        freqVertices[i].y = y_pos;
        freqVertices[i].z = 0.0;
        
        curr_pk_idx = (int)peakIndices[pk_cnt];
        if (curr_pk_idx == i) {
            peakVertices[2*pk_cnt].x = x_pos;
            peakVertices[2*pk_cnt].y = min_y_pos;
            peakVertices[2*pk_cnt].z = 0.0;
            peakVertices[2*pk_cnt + 1].x = x_pos;
            
            // Peak picking based on an adaptive threshold. Magnitudes below threshold are set to -1.
            if(peaksAndValleys.peaks->mag[pk_cnt] != -1){
                peakVertices[2*pk_cnt + 1].y = y_pos;
            }
            
            peakVertices[2*pk_cnt + 1].z = 0.0;
            pk_cnt++;
        }
    }
}

Float32 LPCDisplayManager::getNormalizedFreq(Float32 freq)
/*
 * Compute the normalized frequency, so that the given
 * frequency is mapped to [0.0,1.0] (i.e. the Nyquist frequency
 * will be equal to 1.0).
 */
{
    return 2.0*freq / m_sampleRate;
}

