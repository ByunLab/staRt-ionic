/**
 * @file AudioManager.h
 * @Author Jon Forsyth
 * @date 1/16/14
 * @brief Classes and functions used in audio analysis.
 */


#ifndef __LPC_Display2__AudioManager__
#define __LPC_Display2__AudioManager__

#include <iostream>
#include <AudioToolbox/AudioToolbox.h>

#define DBLBUF_NUM_BUFFERS (2)  /**< number of buffers in DoubleBuffer object */
#define MIN_LPC_ORDER (18)      /**< minimum number of LPC coefficients */
#define MAX_LPC_ORDER (52)      /**< maximum number of LPC coefficients */
#define MAX_BLOCK_SIZE 4096     /**< maximum size of autocorrelation */

#define FREQ_RESP_LEN 512 /* max length of frequency length response */

#ifdef __cplusplus
extern "C" {
#endif
    
    /**
     * Compute autocorrelation of data buffer
     * @param[in] size size of data buffer
     * @param[in] data buffer of data to compute
     * @param[out] result buffer containing result of autocorrelation
     */
    void autocorr(long size,float *data, float *result);
    
    /**
     * Compute autocorrelation of data buffer
     * @param[in] size size of data buffer
     * @param[in] data buffer of data to compute
     * @param[out] result buffer containing result of autocorrelation
     */
    void vautocorr(long size,float *data, float *result);
    
    /**
     * Invert matrix
     * @param[in] size number of rows in matrix mat
     * @param[in] mat matrix to invert
     * @return rank matrix rank (not currently used)
     */
    long minvert(long size, double mat[][MAX_LPC_ORDER]);
    
    /**
     * Invert matrix
     * @param[in] size number of rows in matrix mat
     * @param[in] mat matrix to invert
     */
    void vminvert(long rows, double mat[][MAX_LPC_ORDER]);
    
    /**
     * Compute LPC coefficients from data buffer
     * @param[in] order number of LPC coefficients
     * @param[in] size size of data buffer
     * @param[in] data buffer from which LPC coefficients are computed
     * @param[out] coeffs array containing computed LPC coefficients
     */
    void lpc_from_data(long order, long size, float *data, double *coeffs);
    
    /**
     * Compute the sign of a number
     * @param[in] v number to compute sign of
     * @return 1 if number positive, -1 if number is negative, 0 if number is 0
     */
    int sign(Float32 v);
    
    /**
     * Find the maximum points (peaks) in a signal by looking at slopes of neighboring points
     * @param[in] signal buffer in which to search for peaks
     * @param[in] signalLength length of signal buffer
     * @param[out] peakIndices indices in signal buffer indicating location of peaks
     * @param[out] numPeaks number of peaks found in signal buffer
     */
    void findMaxima(Float32 *signal, UInt32 signalLength, UInt32 *peakIndices, UInt32 *numPeaks);
    
    /**
     * Class to handle multiple buffering of arbitrary arrays.
     */
    class DoubleBuffer {
    public:
        
        /**
         * Constructor
         * @param[in] bufferSize size of each buffer (array)
         * @param[in] numBuffers total number of buffers used
         */
        DoubleBuffer(UInt32 bufferSize, UInt32 numBuffers);
        
        /**
         * Destructor
         */
        ~DoubleBuffer();
        
        /**
         * Write a buffer of data
         * @param[in] inBuffer pointer to data buffer to write
         */
        void writeBuffer(Float32 *inBuffer);
        
        /**
         * Read buffer of data at current index and copy data to specified buffer
         * @param[out] outBuffer pointer to buffer into which data is copied
         */
        void readBuffer(Float32 *outBuffer);
        
        /**
         * Set all buffers to 0
         */
        void resetAllBuffers();
        
        /**
         * Average all buffers in the buffer list into a single buffer (useful for smoothing)
         * @param[out] avgBuffer pointer to buffer into which data is copied
         */
        void averageAllBuffers(Float32 *avgBuffer);
        
        UInt32 m_num_buffers;   /**< number of buffers in buffer list */
        UInt32 m_buffer_size;   /**< size of each buffer in buffer list */
        
    private:
        Float32 **_buffer_list;
        UInt32 _curr_write_idx;
        UInt32 _curr_read_idx;
    };
    
    
    /**
     * Class to compute LPC magnitude spectrum
     */
    class AudioManager {
    public:
        
        /**
         * Constructor
         * @param[in] winSize size of window of input audio buffer
         * @param[in] lpcOrder number of LPC coefficients
         * @param[in] magSpecRes resolution of LPC magnitude spectrum
         * @param[in] sampleRate audio sampling rate
         */
        AudioManager(UInt32 winSize, UInt32 lpcOrder, UInt32 magSpecRes, Float32 sampleRate);
        
        /**
         * Destructor
         */
        ~AudioManager();
        
        /**
         * Compute the LPC coefficients
         */
        void computeLPC();
        
        /**
         * Compute the LPC magnitude spectrum from the LPC coefficients
         * @param[in] gain gain level of audio signal
         */
        void computeLPCFreqResp(Float32 gain);
        
        /**
         * Hardware-accelecrated, compute the LPC magnitude spectrum from the LPC coefficients
         * @param[in] gain gain level of audio signal
         */
        void computeLPCFreqRespV(Float32 gain);
        
        /**
         * Compute the RMS of an audio buffer
         * @param[in] audioBuffer input audio buffer
         * @param[in] winSize size of input audio buffer
         */
        Float32 computeRMS(Float32 *audioBuffer, UInt32 winSize);
        
        /**
         * High-pass filter an audio buffer
         * @param[in] inBuffer input audio buffer
         * @param[in] outBuffer output (i.e. filtered) audio buffer
         * @param[in] winSize size of audio buffers
         */
        void highPassFilter(Float32 *inBuffer, Float32 *outBuffer, UInt32 winSize);
        
        /**
         * Set the LPC order (i.e., number of LPC coefficients)
         * @param[in] lpcOrder the LPC order
         */
        void setLPCOrder(UInt32 lpcOrder);
        
        /**
         * Copy input audio buffer into DoubleBuffer object
         * @param[in] inAudioBuffer input audio buffer, assumed to be of size m_buffer_size
         */
        void grabAudioData(Float32 *inAudioBuffer);
        
        /**
         * Enable computation of LPC coefficients and magnitude spectrum
         */
        void enable_lpc_compute(void) { _computeLPC = true; }
        
        /**
         * Disable computation of LPC coefficients and magnitude spectrum
         */
        void disable_lpc_compute(void) { _computeLPC = false; }
        
        /**
         * Returns whether or not computation of LPC coefficients and magnitude spectrum is enabled
         * @return True/False (is LPC computation enabled or not)
         */
        Boolean canComputeLPC(void) { return _computeLPC; }
        
        // public members
        Float32 m_gain;                         /**< gain level of audio buffer (not currently used) */
        Float32 *m_lpc_mag_buffer;              /**< buffer containing LPC magnitude spectrum */
        double m_lpc_coeffs[MAX_LPC_ORDER+1];   /**< array containing LPC coefficients */
        UInt32 m_lpc_BufferSize;                /**< size of LPC magnitude spectrum */
        UInt32 m_lpc_order;                     /**< number of LPC coefficients */
        UInt32 m_lpc_magSpecResolution;         /**< resolution of LPC magnitude spectrum computation */
        Float32 m_sampleRate;                   /**< audio sampling rate */
        
    private:
        Float32 *_win;
        Boolean _computeLPC;
        DoubleBuffer *_double_buffer;
        
    };
    
    /*
     Peaks and Valleys Structs
     @Authors: Tae Hong Park, Karan Pareek, Scott Murakami
     */
    
    typedef struct {
        float left[FREQ_RESP_LEN];
        float right[FREQ_RESP_LEN];
        
        float leftMean    = 0.0;
        float leftStdDev  = 0.0;
        float rightMean   = 0.0;
        float rightStdDev = 0.0;
    } HEIGHT;
    
    typedef struct {
        float left[FREQ_RESP_LEN];
        float right[FREQ_RESP_LEN];
        
        float leftMean    = 0.0;
        float leftStdDev  = 0.0;
        float rightMean   = 0.0;
        float rightStdDev = 0.0;
    } SPREAD;
    
    typedef struct {
        float left[FREQ_RESP_LEN];
        float right[FREQ_RESP_LEN];
        
        float leftMean    = 0.0;
        float leftStdDev  = 0.0;
        float rightMean   = 0.0;
        float rightStdDev = 0.0;
    } SLOPE;
    
    typedef struct {
        float *idx;
        float *mag;
        
        HEIGHT height;
        SPREAD spread;
        SLOPE slope;
    } PEAKS;
    
    typedef struct {
        float *idx;
        float *mag;
    } VALLEYS;
    
    /*
     Peaks and Valleys Class
     @Authors: Tae Hong Park, Karan Pareek, Scott Murakami
     */
    
    class PeaksAndValleys{
        
    public:
        
        // Main init variables
        unsigned int valleyPair;
        unsigned int prevSlopePos;
        unsigned int len;
        int cntValley;
        int cntPeak;
        bool init;
        bool initDisplayPtr;
        float noiseFloor;
        
        // Pointer variables for script
        float *sigPointer; // Points to avgLpc
        float *initValue; // Length: signalLength
        float *slopes;    // Length: signalLength-1
        
        PEAKS *peaks;
        VALLEYS *valleys;
        
        
        /*
         Constructor
         */
        PeaksAndValleys();
        
        /*
         Destructor
         */
        ~PeaksAndValleys();
        
        /*
         Computation method
         @param[in] signal - LPC spectrum
         */
        void computeParams(float *signal);
        
        /*
         Negative slope method
         */
        void addPeaksAndValleys(int isPos);
        
        /*
         Update Peaks
         */
        void updatePeaks(int k);
        
        /*
         Update Valleys
         */
        void updateValleys(int k);
        
        /*
         Peak and Valley analysis
         */
        void analysis();
        
        /*
         Initializer
         @param[in] signal - LPC spectrum
         @param[in] signalLength - length of LPC spectrum or numDisplayBins
         */
        void displayInit(float *signal, unsigned int signalLength);
        
        /*
         Reset class values
         @param[in] signalLength - length of LPC spectrum or numDisplayBins
         */
        void resetValues(unsigned int signalLength);
        
        /*
         Post filtering
         */
        void postFiltering();
        
        /*
         Compute statistics
         */
        void computeStats();
        
    };
    
#ifdef __cplusplus
}
#endif


#endif /* defined(__LPC_Display2__AudioManager__) */
