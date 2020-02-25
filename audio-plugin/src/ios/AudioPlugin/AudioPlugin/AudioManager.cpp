    /**
 * @file AudioManager.cpp
 * @Author Jon Forsyth
 * @date 1/16/14
 * @brief Classes and functions used in audio analysis.
 */

#include <complex>
#include <math.h>
#include <Accelerate/Accelerate.h>
#include "AudioManager.h"


DoubleBuffer::DoubleBuffer(UInt32 bufferSize, UInt32 numBuffers) :
_curr_write_idx(0),
_curr_read_idx(1)
{
    m_buffer_size = bufferSize;
    m_num_buffers = numBuffers;
    
    _buffer_list = new Float32*[this->m_num_buffers];
    
    for (int i=0; i<this->m_num_buffers; i++) {
        _buffer_list[i] = new Float32[m_buffer_size];
        memset(_buffer_list[i], 0, m_buffer_size * sizeof(Float32));
    }
}

DoubleBuffer::~DoubleBuffer()
{
    for (int i=0; i<this->m_num_buffers; i++) {
        delete [] _buffer_list[i];
    }
}

void DoubleBuffer::writeBuffer(Float32 *inBuffer)
{
    memcpy(_buffer_list[_curr_write_idx], inBuffer, m_buffer_size * sizeof(Float32));
    _curr_read_idx = _curr_write_idx;
    _curr_write_idx = (_curr_write_idx + 1) % this->m_num_buffers;
}

void DoubleBuffer::readBuffer(Float32 *outBuffer)
{
    memcpy(outBuffer, _buffer_list[_curr_read_idx], m_buffer_size * sizeof(Float32));
}

void DoubleBuffer::resetAllBuffers()
{
    for (int i=0; i<this->m_num_buffers; i++) {
        memset(_buffer_list[i], 0, m_buffer_size * sizeof(Float32));
    }
}

void DoubleBuffer::averageAllBuffers(Float32 *avgBuffer)
{
    memset(avgBuffer, 0, this->m_buffer_size * sizeof(Float32));
    for (int i=0; i<this->m_num_buffers; i++) {
        for (int j=0; j<this->m_buffer_size; j++) {
            avgBuffer[j] += this->_buffer_list[i][j]/(Float32)this->m_buffer_size;
        }
    }
}


/* ------------------------------------------------------- */
/* ---------------    AudioManager   --------------------- */
/* ------------------------------------------------------- */

AudioManager::AudioManager(UInt32 lpcBuffSize, UInt32 lpcOrder, UInt32 magSpecRes, Float32 sampleRate):
    _computeLPC(false)
{
    m_lpc_BufferSize = lpcBuffSize;
    m_lpc_magSpecResolution = magSpecRes;
    m_sampleRate = sampleRate;
    
    m_gain = 0.0;
    this->setLPCOrder(lpcOrder);
    
    _double_buffer = new DoubleBuffer(m_lpc_BufferSize, DBLBUF_NUM_BUFFERS);
    
    m_lpc_mag_buffer = new Float32[m_lpc_BufferSize];
    memset(m_lpc_mag_buffer, 0, m_lpc_BufferSize * sizeof(Float32));
    
    // Hanning window
    _win = new Float32[m_lpc_BufferSize];
    vDSP_hann_window(_win, m_lpc_BufferSize, vDSP_HANN_NORM);
    
}

AudioManager::~AudioManager()
{
    
    delete [] m_lpc_mag_buffer;
    delete [] _win;
    delete _double_buffer;
}


void AudioManager::grabAudioData(Float32 *inAudioBuffer)
{
    _double_buffer->writeBuffer(inAudioBuffer);
}

Float32 AudioManager::computeRMS(Float32 *audioBuffer, UInt32 winSize)
{
    float rms;
    vDSP_rmsqv(audioBuffer, (vDSP_Stride)1, &rms, (vDSP_Length)winSize);
    return (Float32)rms;
}

/* LPC stuff */
void AudioManager::setLPCOrder(UInt32 lpcOrder)
{
    if (lpcOrder>MAX_LPC_ORDER) {
        lpcOrder = MAX_LPC_ORDER;
    }
    m_lpc_order = lpcOrder;
 
    //_double_buffer->resetAllBuffers();
    memset(m_lpc_coeffs, 0, (m_lpc_order+1) * sizeof(double));
}

void AudioManager::computeLPC()
{
    if (!_computeLPC) {
        return;
    }
    
    // get current read buffer
    Float32 curr_audio_buffer[m_lpc_BufferSize];

    _double_buffer->readBuffer(curr_audio_buffer);

    // remove mean
    vDSP_Stride stride = (vDSP_Stride)1;
    float mean;
    vDSP_meanv((float *)curr_audio_buffer, stride, &mean, m_lpc_BufferSize);
    mean = -mean;
    vDSP_vsadd(curr_audio_buffer, stride, &mean, curr_audio_buffer, stride, m_lpc_BufferSize);
    
    // apply window to buffer
    vDSP_vmul(curr_audio_buffer,(vDSP_Stride)1,_win,(vDSP_Stride)1,curr_audio_buffer,(vDSP_Stride)1,m_lpc_BufferSize);

    // apply high-pass filter
    Float32 tmpBuff[m_lpc_BufferSize];
    memcpy(tmpBuff, curr_audio_buffer, m_lpc_BufferSize * sizeof(Float32));
    memset(curr_audio_buffer, 0, m_lpc_BufferSize * sizeof(Float32));
    this->highPassFilter(tmpBuff, curr_audio_buffer, m_lpc_BufferSize);

    // compute LPC coefficients
    memset(m_lpc_coeffs, 0, (m_lpc_order+1) * sizeof(double));

    double lpc_coeffs[m_lpc_order];
    lpc_from_data(m_lpc_order, m_lpc_BufferSize, curr_audio_buffer, lpc_coeffs);
    m_lpc_coeffs[0] = 1.0;
    for (int i=1; i<m_lpc_order+1; i++) {
        m_lpc_coeffs[i] = -lpc_coeffs[i-1];
    }

    Float32 gain = 0.5;
    this->computeLPCFreqRespV(gain);
}

void AudioManager::computeLPCFreqResp(Float32 gain)
{
    double incr = M_PI / ((double)m_lpc_magSpecResolution - 1.0);
    std::complex<double> I(0.0,1.0);
    std::complex<double> One(1.0,0.0);

    for (int k=0; k<m_lpc_magSpecResolution; k++) {
        std::complex<double> tmp_sum(0.0,0.0);
        double angle = ((double)k)*incr;
        for (int j=0; j<m_lpc_order+1; j++) {
            tmp_sum += m_lpc_coeffs[j] * exp(angle*j*I);
        }
        m_lpc_mag_buffer[k] = gain/(abs(tmp_sum) + 1e-20);
    }
}

void AudioManager::computeLPCFreqRespV(Float32 gain)
{
    double incr = M_PI / ((double)m_lpc_magSpecResolution - 1.0);
    float vin[m_lpc_magSpecResolution][(m_lpc_order+1)*2];
    float vout[m_lpc_magSpecResolution][(m_lpc_order+1)*2];
    
    for (int k=0; k<m_lpc_magSpecResolution; k++) {
        double angle = ((double)k)*incr;
        for (int j=0; j<m_lpc_order+1; j++) {
            vin[k][2*j] = m_lpc_coeffs[j];
            vin[k][2*j+1] = angle*j;
        }
    }
    vDSP_rect((float *)vin, 2, (float *)vout, 2, (m_lpc_order+1) * m_lpc_magSpecResolution);
    for (int k=0; k<m_lpc_magSpecResolution; k++) {
        std::complex<double> tmp_sum(0.0,0.0);
        for (int j=0; j<m_lpc_order+1; j++) {
            tmp_sum += std::complex<double>(vout[k][2*j], vout[k][2*j+1]);
        }
        m_lpc_mag_buffer[k] = gain/(abs(tmp_sum) + 1e-20);
    }
}

void AudioManager::highPassFilter(Float32 *inBuffer, Float32 *outBuffer, UInt32 winSize)
{
    Float32 delsmp = 0.0f;
    for (UInt32 i=0; i<winSize; i++) {
        outBuffer[i] = inBuffer[i] - 0.94*delsmp;
        delsmp = inBuffer[i];
    }
}

/* ------------------------------------------------------- */
/* ---------------      functions    --------------------- */
/* ------------------------------------------------------- */


void lpc_from_data(long order, long size, float *data, double *coeffs)
{
    double r_mat[MAX_LPC_ORDER][MAX_LPC_ORDER];
    long i,j;
    float corr[MAX_BLOCK_SIZE];
    
    autocorr(size,data,corr);
    
    // New, hardware accelerated matrix inverse
    for (i=1;i<order;i++) {
        for (j=1;j<order;j++) r_mat[(i-1)][(j-1)] = corr[abs(i-j)];
    }
    vminvert(order-1,r_mat);
    for (i=0;i<order-1;i++)     {
        coeffs[i] = 0.0;
        for (j=0;j<order-1;j++)	{
            coeffs[i] += r_mat[i][j] * corr[1+j];
        }
    }
    
    // Old, non-hardware accelerated inverse
    /*
    for (i=1;i<order;i++) {
        for (j=1;j<order;j++) r_mat[i][j] = corr[abs(i-j)];
    }
    minvert(order-1,r_mat);
    for (i=0;i<order-1;i++)     {
        coeffs[i] = 0.0;
        for (j=0;j<order-1;j++)	{
            coeffs[i] += r_mat[i+1][j+1] * corr[1+j];
        }
    }
    */
}

void autocorr(long size, float *data, float *result)
{
    long i,j,k;
    double temp,norm;
    
    for (i=0;i<size/2;i++) {
        result[i] = 0.0;
        for (j=0;j<size-i-1;j++)	{
            result[i] += data[i+j] * data[j];
        }
    }
    
    // find positive slope, store in j
    temp = result[0];
    j = (long) size*0.02;
    while (result[j]<temp && j < size/2)	{
        temp = result[j];
        j += 1;
    }
    
    temp = 0.0;
    for (i=j;i<size*0.5;i++) {
        if (result[i]>temp) {
            j = i;
            temp = result[i];
        }
    }
    norm = 1.0 / size;
    k = size/2;
    for (i=0;i<size/2;i++)
        result[i] *=  (k - i) * norm;
    if (result[j] == 0) j = 0;
    else if ((result[j] / result[0]) < 0.4) j = 0;
    else if (j > size/4) j = 0;
}

void vautocorr(long size, float *data, float *result)
{
    long i,j,k;
    double temp,norm;
    float *signal, *filter;
    uint32_t lenSignal, filterLength, resultLength;
    
    filterLength = size;
    resultLength = filterLength;
    lenSignal = ((filterLength + 3) & 0xFFFFFFFC) + resultLength;
    
    signal = (float *) calloc(lenSignal, sizeof(float));
    filter = (float *) malloc(filterLength * sizeof(float));
    
    for (i = 0; i < filterLength; i++)
        filter[i] = data[i];
    
    for (i = 0; i < resultLength; i++)
        if (i >=resultLength- filterLength)
            signal[i] = filter[i - filterLength+1];
    
    vDSP_conv(signal, 1, filter, 1, result, 1, resultLength, filterLength);
    free(signal);
    free(filter);
    
    // find positive slope, store in j
    temp = result[0];
    j = (long) size*0.02;
    while (result[j]<temp && j < size/2)	{
        temp = result[j];
        j += 1;
    }
    
    temp = 0.0;
    for (i=j;i<size*0.5;i++) {
        if (result[i]>temp) {
            j = i;
            temp = result[i];
        }
    }
    norm = 1.0 / size;
    k = size/2;
    for (i=0;i<size/2;i++)
        result[i] *=  (k - i) * norm;
    if (result[j] == 0) j = 0;
    else if ((result[j] / result[0]) < 0.4) j = 0;
    else if (j > size/4) j = 0;
}

long minvert(long size, double mat[][MAX_LPC_ORDER])
{
    long item,row,col,rank=0; //,t2;
    double temp,res[MAX_LPC_ORDER][MAX_LPC_ORDER];
//    long ok,zerorow;
    
    for (row=1;row<=size;row++)     {
        for (col=1;col<=size;col++)	{
            //    printf(stdout," %f ",mat[row][col]);
            if (row==col)
                res[row][col] = 1.0;
            else
                res[row][col] = 0.0;
        }
        //    fprintf(stdout,"\n");
    }
    for (item=1;item<=size;item++) {
        if (mat[item][item]==0)		{
            for (row=item;row<=size;row++)   {
                for (col=1;col<=size;col++)	{
                    mat[item][col] = mat[item][col] + mat[row][col];
                    res[item][col] = res[item][col] + res[row][col];
                }
            }
        }
        for (row=item;row<=size;row++)  {
            temp=mat[row][item];
            if (temp!=0)	{
                for (col=1;col<=size;col++)	{
                    mat[row][col] = mat[row][col] / temp;
                    res[row][col] = res[row][col] / temp;
                }
            }
        }
        if (item!=size)	{
            for (row=item+1;row<=size;row++)	{
                temp=mat[row][item];
                if (temp!=0)	{
                    for (col=1;col<=size;col++)	{
                        mat[row][col] = mat[row][col] - mat[item][col];
                        res[row][col] = res[row][col] - res[item][col];
                    }
                }
            }
        }
    }
    for (item=2;item<=size;item++)   {
        for (row=1;row<item;row++)	{
    	    temp = mat[row][item];
            for (col=1;col<=size;col++)	   {
                mat[row][col] = mat[row][col] - temp * mat[item][col];
                res[row][col] = res[row][col] - temp * res[item][col];
            }
        }
    }
    /*    ok = TRUE;
     rank = 0;
     for (row=1;row<=size;row++)	{
     zerorow = TRUE;
     for (col=1;col<=size;col++)	{
     if (mat[row][col]!=0) zerorow = FALSE;
     t2 = (mat[row][col] + 0.5);
     if (row==col&&t2!=1) ok = FALSE;
     t2 = fabs(mat[row][col]*100.0);
     if (row!=col&&t2!=0) ok = FALSE;
     }
     if (!zerorow) rank += 1;
     }
     if (!ok)	{
     fprintf(stdout,"Matrix Not Invertible\n");
     fprintf(stdout,"Rank is Only %i of %i\n",rank,size);
     }									*/
    for (row=1;row<=size;row++)	{
        for (col=1;col<=size;col++)	{
            mat[row][col] = res[row][col];
        }
    }
    return rank;
}

void vminvert(long size, double mat[][MAX_LPC_ORDER])
{
    __CLPK_integer error=0;
    __CLPK_integer lda = MAX_LPC_ORDER;
    __CLPK_integer pivot[MAX_LPC_ORDER];
    __CLPK_doublereal workspace[MAX_LPC_ORDER];
    __CLPK_integer N = size;
    
    /*  LU factorisation */
    dgetrf_(&N, &N, (__CLPK_doublereal *)mat, &lda, pivot, &error);
    
    if (error != 0) {
        // handle the error
    }
    
    /*  matrix inversion */
    dgetri_(&N, (__CLPK_doublereal *)mat, &lda, pivot, workspace, &N, &error);
    
    if (error != 0) {
        // handle the second error
    }
}


/* ------------------------------------------------------- */
/* ---------------     helper functions ------------------ */
/* ------------------------------------------------------- */

void findMaxima(Float32 *signal, UInt32 signalLength, UInt32 *peakIndices, UInt32 *numPeaks)
{
    int cnt = 0;
    Float32 slopes[signalLength];
    
    // compute slopes
    for (int i=0; i<signalLength-1; i++) {
        slopes[i] = 0.5*(signal[i+1]-signal[i]);
    }
    slopes[signalLength-1] = 0.0;
    
    Boolean look_for_peak = true;
    
    for (int i=0; i<signalLength; i++) {
        if (sign(slopes[i])<0) {
            if (look_for_peak) {
                peakIndices[cnt] = i;
                cnt++;
                look_for_peak = false;
            }
        }
        else {
            look_for_peak = true;
        }
    }
    *numPeaks = cnt;
}


int sign(Float32 v)
{
    if (v>0.0) return 1;
    else if (v<0.0) return -1;
    else return 0;
}


