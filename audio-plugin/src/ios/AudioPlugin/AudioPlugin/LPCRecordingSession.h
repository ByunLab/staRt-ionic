//
//  LPCRecordingSession.h
//  lpc_app
//
//  Created by Sam Tarakajian on 12/2/15.
//
//

#import <Foundation/Foundation.h>
#include "LPCRecordingSessionData.h"
#include "LPCUploadable.h"
#include "LPCProfileDescription.h"

FOUNDATION_EXPORT NSString *const LPCRecordingSessionMetadataKey;
FOUNDATION_EXPORT NSString *const LPCRecordingSessionLPCKey;
FOUNDATION_EXPORT NSString *const LPCRecordingSessionAudioKey;

@interface LPCRecordingSession : NSObject <LPCUploadable>
@property (nonatomic, readonly) NSString *metadataFilename;
@property (nonatomic, readonly) NSString *lpcFilename;
@property (nonatomic, readonly) NSString *audioFilename;

+ (instancetype) sessionWithProfileDescription:(LPCProfileDescription *)profile clientUserData:(NSString *)userDataString recordingSessionId:(NSString *)recordingSessionId;
+ (instancetype) sessionWithMetadataFile:(NSString *)metadata;
+ (NSArray<LPCRecordingSession *> *) recordingsForAccount:(LPCProfileDescription *)profile;
+ (NSString *) recordingDirectory;
- (LPCRecordingSessionData) dataWithLpcOrder:(uint16_t)lpcOrder;
- (NSDictionary *)recordingFilesDictionary;
- (void)deleteFiles;
- (void)endRecording;

@end
