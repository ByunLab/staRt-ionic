//
//  APAudioManager.h
//  AudioPlugin
//
//  Created by Sam Tarakajian on 5/19/16.
//  Copyright © 2016 Girlfriends Labs. All rights reserved.
//

#import <Foundation/Foundation.h>

@class LPCRecordingSession, APLPCCalculator;

@interface APAudioManager : NSObject
- (void) start;
- (void) startRecordingForRecordingSession:(LPCRecordingSession *)session;
- (void) stopRecording;

@property (nonatomic, readonly) LPCRecordingSession *currentRecordingSession;
@property (nonatomic, readonly) APLPCCalculator *lpcCalculator;
@end
