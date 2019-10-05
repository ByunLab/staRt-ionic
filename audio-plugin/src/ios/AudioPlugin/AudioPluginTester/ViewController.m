//
//  ViewController.m
//  AudioPluginTester
//
//  Created by Sam Tarakajian on 5/19/16.
//  Copyright © 2016 Girlfriends Labs. All rights reserved.
//

#import "ViewController.h"
#import "APAudioManager.h"
#import "LPCProfileDescription.h"
#import "LPCRecordingSession.h"
#import "CHCSVParser.h"
#import "LPCDisplayView.h"
#import "APLPCCalculator.h"

static NSDictionary *s_descDict;

@interface ViewController ()
@property (nonatomic, strong) APAudioManager *audioManager;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    s_descDict = @{
            LPCProfileDescriptionKeyAge: @(13),
            LPCProfileDescriptionKeyGender: @"M",
            LPCProfileDescriptionKeyHeightFeet: @(5),
            LPCProfileDescriptionKeyHeightInches: @(11),
            LPCProfileDescriptionKeyName: @"Testerman",
            LPCProfileDescriptionKeyStdevF3: @(100),
            LPCProfileDescriptionKeyTargetF3: @(1100),
            LPCProfileDescriptionKeyTargetLPCOrder: @(32),
            LPCProfileDescriptionKeyUUID: @"SomethingVeryUnique"
            };
    
    self.audioManager = [[APAudioManager alloc] init];
    [self.audioManager start];
    
    CADisplayLink *lnk = [CADisplayLink displayLinkWithTarget:self selector:@selector(updateLPCDisplay)];
    [lnk addToRunLoop:[NSRunLoop currentRunLoop]
              forMode:NSRunLoopCommonModes];
    [self.audioManager.lpcCalculator setLpcOrder:40];
}

- (void) updateLPCDisplay
{
	NSDictionary *coeffs = [self.audioManager.lpcCalculator fetchCurrentCoefficients];
    double frequencyScaling = [self.audioManager.lpcCalculator frequencyScaling];
    [self.lpcDisplayView setFrequencyScaling:frequencyScaling];
    [self.lpcDisplayView setLPCCoefficients:[coeffs objectForKey:@"coefficients"]];
    [self.lpcDisplayView setPeakPoints:[coeffs objectForKey:@"peaks"]];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)startRecording:(id)sender
{
    LPCProfileDescription *desc = [LPCProfileDescription accountDescriptionWithDictionary:s_descDict];
    LPCRecordingSession *session = [LPCRecordingSession sessionWithProfileDescription:desc clientUserData:@"" recordingSessionId:@""];
    [self.audioManager startRecordingForRecordingSession:session];
}

- (IBAction)stopRecording:(id)sender
{
	[self.audioManager stopRecording];
}

- (IBAction)listRecordings:(id)sender
{
    LPCProfileDescription *desc = [LPCProfileDescription accountDescriptionWithDictionary:s_descDict];
    NSArray<LPCRecordingSession *> *sessions = [LPCRecordingSession recordingsForAccount:desc];
    NSLog(@"%@", [sessions description]);
}

@end
