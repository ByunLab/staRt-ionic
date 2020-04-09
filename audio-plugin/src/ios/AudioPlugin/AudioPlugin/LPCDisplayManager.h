/**
 * @file LPCDisplayManager.cpp
 * @Author Jon Forsyth
 * @date 7/25/14
 * @brief Classes and functions used for displaying LPC magnitude spectrum and spectral peaks.
 */

#ifndef __lpc_app__LPCDisplayManager__
#define __lpc_app__LPCDisplayManager__

#include "MacTypes.h"
#include <cstdint>
#include "AudioManager.h"

class DoubleBuffer;

union _Vector3
{
    struct { float x, y, z; };
    struct { float r, g, b; };
    struct { float s, t, p; };
    float v[3];
};
typedef union _Vector3 Vector3;

/**
 * Class to manage display of LPC magnitude spectrum
 */
class LPCDisplayManager {
public:

    /**
     * Constructor
     * @param[in] numDisplayBins size of array used to display LPC magnitude spectrum
     * @param[in] sampleRate audio sample rate
     */
    LPCDisplayManager(UInt32 numDisplayBins, Float32 sampleRate);

    /**
     * Destructor
     */
    ~LPCDisplayManager();

    /**
     * Get the normalized frequency (value in [0.0,1.0]) from frequency in Hz (value in [0,sampleRate/2])
     * @param[in] freq frequency in Hz
     * @return normalized frequency
     */
    Float32 getNormalizedFreq(Float32 freq);

    /**
     * Assign 3D points from lpc magnitude data
     * @param[in] lpc_mag_buffer LPC magnitude buffer to draw
     * @param[out] freqVertices Vector3 containing points defining LPC magnitude spectrum
     * @param[out] peakVertices Vector3 containing points defining lines indicating peaks in LPC magnitude spectrum
     */
    void render(Float32 *lpc_mag_buffer, Vector3 *freqVertices, Vector3 *peakVertices);

    /**
     * Assign target formant frequency lines from target formant frequencies
     * @param[out] targFreqVertices SceneVertex containing points defining lines indicating target formant frequencies in LPC magnitude spectrum
     * @param[in] targFormantFreqs array containing frequencies in Hz indicating target formant frequencies
     * @param[in] maxNumTargFormantFreqs number of target formant frequencies
     */
    void renderTargetFormantFreqs(Vector3 *targFreqVertices, double *targFormantFreqs, int maxNumTargFormantFreqs);

    // properties
    Float32 m_sampleRate;           /**< audio sample rate */
    UInt32 m_numPeaks;              /**< number of peaks in LPC magnitude spectrum */
    UInt32 _numDisplayBins;         /**< size of array used to display LPC magnitude spectrum  */

    // Call Peaks and Valleys class here
    PeaksAndValleys *peaksAndValleys;
    PeaksAndValleys *peaksAndValleysLPF;

    PeakTracker *peakTracker;

private:

    // properties
    DoubleBuffer *_historyBuffer;
    float _displayPad;
};


#endif /* defined(__lpc_app__GUIManager__) */
