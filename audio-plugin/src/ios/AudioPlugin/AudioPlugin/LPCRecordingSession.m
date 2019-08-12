//
//  LPCRecordingSession.m
//  lpc_app
//
//  Created by Sam Tarakajian on 12/2/15.
//
//

#import <UIKit/UIKit.h>
#import "LPCRecordingSession.h"
#import "APAudioManager.h"
#import "CHCSVParser.h"

NSString *const LPCRecordingSessionMetadataKey = @"Metadata";
NSString *const LPCRecordingSessionLPCKey = @"LPC";
NSString *const LPCRecordingSessionAudioKey = @"Audio";

#define kAccountUUIDKey         @"AccountUUID"
#define kAccountMetadataKey     @"AccountMetadata"
#define kDateKey                @"Date"

@interface LPCRecordingSession ()
@property (nonatomic, strong) NSDate *date;
@property (nonatomic, strong) NSString *dateString, *userDataString, *endDateString;
@property (nonatomic, strong) NSString *metadataFilename, *lpcFilename, *audioFilename;
@property (nonatomic, strong) LPCProfileDescription *profileDescription;
@end

@implementation LPCRecordingSession

+ (NSDateFormatter *) recordingSessionDateFormatter
{
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    NSLocale *enUSPOSIXLocale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    [dateFormatter setLocale:enUSPOSIXLocale];
    [dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH-mm-ss"];
    return dateFormatter;
}

+ (instancetype) sessionWithProfileDescription:(LPCProfileDescription *)profile clientUserData:(NSString *)userDataString recordingSessionId:(NSString *)recordingSessionId
{
    LPCRecordingSession *session = [[LPCRecordingSession alloc] init];
    session.profileDescription = profile;
	session.userDataString = userDataString;
    session.date = [NSDate date];
    
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    NSLocale *enUSPOSIXLocale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
    [dateFormatter setLocale:enUSPOSIXLocale];
    [dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH-mm-ss"];
	
    session.dateString = [dateFormatter stringFromDate:session.date];
	session.endDateString = @"";
    session.metadataFilename = [NSString stringWithFormat:@"%@-%@-meta.csv", recordingSessionId, session.dateString];
    session.lpcFilename = [NSString stringWithFormat:@"%@-%@-lpc.csv", recordingSessionId, session.dateString];
    session.audioFilename = [NSString stringWithFormat:@"%@-%@-audio.m4a", recordingSessionId, session.dateString];
    
    return session;
}

+ (NSDictionary *) metadataDictionaryFromMetadataCSVDictionary:(NSDictionary *)metadataFileDict
{
    NSMutableDictionary *retDict = [NSMutableDictionary dictionary];
    [retDict setObject:[metadataFileDict objectForKey:@"username"] forKey:LPCProfileDescriptionKeyName];
    [retDict setObject:[metadataFileDict objectForKey:@"gender"] forKey:LPCProfileDescriptionKeyGender];
    [retDict setObject:[metadataFileDict objectForKey:@"age"] forKey:LPCProfileDescriptionKeyAge];
    [retDict setObject:[metadataFileDict objectForKey:@"heightFeet"] forKey:LPCProfileDescriptionKeyHeightFeet];
    [retDict setObject:[metadataFileDict objectForKey:@"heightInches"] forKey:LPCProfileDescriptionKeyHeightInches];
    [retDict setObject:[metadataFileDict objectForKey:@"gender"] forKey:LPCProfileDescriptionKeyGender];
    return [NSDictionary dictionaryWithDictionary:retDict];
}

+ (instancetype) sessionWithMetadataFile:(NSString *)metadata
{
    LPCRecordingSession *session = [[LPCRecordingSession alloc] init];
    NSDateFormatter *dateFormatter = [LPCRecordingSession recordingSessionDateFormatter];
    session.metadataFilename = metadata;
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    NSString *urlSafeString = [recordingDirectory stringByAppendingPathComponent:metadata];
    if (![[NSFileManager defaultManager] fileExistsAtPath:urlSafeString])
        return nil;
    
    NSURL *metadataURL = [NSURL fileURLWithPath:urlSafeString];
    NSError *error = nil;
    NSArray<CHCSVOrderedDictionary *> *rows = [NSArray arrayWithContentsOfCSVURL:metadataURL options:CHCSVParserOptionsUsesFirstLineAsKeys|CHCSVParserOptionsSanitizesFields|CHCSVParserOptionsTrimsWhitespace];
    if (error) {
        NSLog(@"%@", [error localizedDescription]);
        return nil;
    }
	
	if (rows.count == 0) {
		return nil;
	}
	
	session.userDataString = [rows[0] objectForKey:@"user_string"];
    session.dateString = [rows[0] objectForKey:@"start_date"];
	session.endDateString = [rows[0] objectForKey:@"end_date"];
    session.lpcFilename = [[rows[0] objectForKey:@"lpc_file"] lastPathComponent];
    session.audioFilename = [[rows[0] objectForKey:@"audio_file"] lastPathComponent];
    session.profileDescription = [LPCProfileDescription accountDescriptionWithRecordingMetadataURL:metadataURL];
    session.date = [dateFormatter dateFromString:session.dateString];
    return session;
}

+ (NSArray<LPCRecordingSession *> *) recordingsForAccount:(LPCProfileDescription *)profile
{
    NSMutableArray *retArray = [NSMutableArray array];
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    
    NSFileManager *manager = [NSFileManager defaultManager];
    NSArray *fileList = [manager contentsOfDirectoryAtPath:recordingDirectory error:nil];
    for (NSString *s in fileList){
        if ([s hasSuffix:@"-meta.csv"]) {
            LPCRecordingSession *session = [LPCRecordingSession sessionWithMetadataFile:s];
            if (session && [session.profileDescription.uuid isEqualToString:profile.uuid]) {
                [retArray addObject:[session recordingFilesDictionary]];
            }
        }
    }
    
    return [NSArray arrayWithArray:retArray];
}

+ (NSString *) recordingDirectory
{
    NSString *applicationSupportDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) lastObject];
    NSString *recordingDirectory = [applicationSupportDirectory stringByAppendingPathComponent:@"recordings"];
    NSFileManager *manager = [NSFileManager defaultManager];
    if(![manager fileExistsAtPath:recordingDirectory]) {
        __autoreleasing NSError *error;
        BOOL ret = [manager createDirectoryAtPath:recordingDirectory withIntermediateDirectories:YES attributes:nil error:&error];
        if(!ret) {
            NSLog(@"ERROR app support: %@", error);
            exit(0);
        }
    }
    return recordingDirectory;
}

- (LPCRecordingSessionData) dataWithLpcOrder:(uint16_t)lpcOrder
{
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    NSString *escapedSupportDir = [recordingDirectory stringByAddingPercentEncodingWithAllowedCharacters:[NSCharacterSet URLPathAllowedCharacterSet]];
    NSURL *audioFileURL = [[NSURL URLWithString:escapedSupportDir] URLByAppendingPathComponent:self.audioFilename];
    NSURL *lpcFileURL = [[NSURL URLWithString:escapedSupportDir] URLByAppendingPathComponent:self.lpcFilename];
    NSURL *metadataFileURL = [[NSURL URLWithString:escapedSupportDir] URLByAppendingPathComponent:self.metadataFilename];
    
    LPCRecordingSessionData data;
    data.accountUUID = [self.profileDescription.uuid cStringUsingEncoding:NSUTF8StringEncoding];
    
    if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyName]) {
        data.username = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyName] cStringUsingEncoding:NSUTF8StringEncoding];
    } else {
        data.username = nil;
    }
	if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyEmail]) {
		data.accountEmail = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyEmail] cStringUsingEncoding:NSUTF8StringEncoding];
	} else {
		data.accountEmail = nil;
	}
    if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyGender]) {
        data.gender = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyGender] cStringUsingEncoding:NSUTF8StringEncoding];
    } else {
        data.gender = nil;
    }
    if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyAge]) {
        data.ageInYears = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyAge] integerValue];
    } else {
        data.ageInYears = -1;
    }
    if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyHeightFeet]) {
        data.heightFeet = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyHeightFeet] integerValue];
    } else {
        data.ageInYears = -1;
    }
    if ([self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyHeightInches]) {
        data.heightInches = [[self.profileDescription.metadata objectForKey:LPCProfileDescriptionKeyHeightInches] integerValue];
    } else {
        data.ageInYears = -1;
    }
	
	data.userDataString = [self.userDataString cStringUsingEncoding:NSUTF8StringEncoding];
    data.targetF3 = self.profileDescription.targetF3;
    data.stdevF3 = self.profileDescription.stdevF3;
    data.targetLPCOrder = self.profileDescription.targetLPCOrder;
    data.audio_path = [[[audioFileURL absoluteString] stringByRemovingPercentEncoding] cStringUsingEncoding:NSUTF8StringEncoding];
    data.lpc_path = [[[lpcFileURL absoluteString] stringByRemovingPercentEncoding] cStringUsingEncoding:NSUTF8StringEncoding];
    data.metadata_path = [[[metadataFileURL absoluteString] stringByRemovingPercentEncoding] cStringUsingEncoding:NSUTF8StringEncoding];
    data.date_string = [self.dateString cStringUsingEncoding:NSUTF8StringEncoding];
	data.end_date_string = [self.endDateString cStringUsingEncoding:NSUTF8StringEncoding];
    data.identifier = [[[[UIDevice currentDevice] identifierForVendor] UUIDString] cStringUsingEncoding:NSUTF8StringEncoding];
    data.lpc_order = lpcOrder;
    
    return data;
}

- (NSDictionary *)recordingFilesDictionary
{
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    NSMutableDictionary *mutRep = [NSMutableDictionary dictionary];
    [mutRep setObject:[recordingDirectory stringByAppendingPathComponent:self.metadataFilename] forKey:LPCRecordingSessionMetadataKey];
    [mutRep setObject:[recordingDirectory stringByAppendingPathComponent:self.lpcFilename] forKey:LPCRecordingSessionLPCKey];
    [mutRep setObject:[recordingDirectory stringByAppendingPathComponent:self.audioFilename] forKey:LPCRecordingSessionAudioKey];
	[mutRep setObject:self.dateString forKey:@"date"];
	[mutRep setObject:self.userDataString forKey:@"userString"];
	[mutRep setObject:self.endDateString forKey:@"endDate"];
    return mutRep;
}

- (void)deleteFiles
{
    NSFileManager *manager = [NSFileManager defaultManager];
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    [manager removeItemAtPath:[recordingDirectory stringByAppendingPathComponent:self.metadataFilename] error:nil];
    [manager removeItemAtPath:[recordingDirectory stringByAppendingPathComponent:self.lpcFilename] error:nil];
    [manager removeItemAtPath:[recordingDirectory stringByAppendingPathComponent:self.audioFilename] error:nil];
}

- (void)endRecording
{
	NSDateFormatter *dateFormatter = [LPCRecordingSession recordingSessionDateFormatter];
	NSDate *d = [NSDate date];
	self.endDateString = [dateFormatter stringFromDate:d];
}

#pragma mark - LPCUploadable
- (NSString *) title
{
    return [NSString stringWithFormat:@"Recording Session:%@", self.metadataFilename];
}

- (NSUInteger) numberOfAttachments {return 3;}

- (NSString *) nameForAttachmentAtIndex:(NSUInteger)index
{
    NSString *name = nil;
    switch (index) {
        case 0:
            name = self.audioFilename;
            break;
        case 1:
            name = self.lpcFilename;
            break;
        case 2:
            name = self.metadataFilename;
            break;
            
        default:
            break;
    }
    return name;
}

- (NSString *) mimeTypeForAttachmentAtIndex:(NSUInteger)index
{
    NSString *mimetype = nil;
    switch (index) {
        case 0:
            mimetype = @"audio/wav";
            break;
        case 1:
        case 2:
            mimetype = @"text/csv";
            break;
            
        default:
            break;
    }
    return mimetype;
}

- (NSData *) dataForAttachmentAtIndex:(NSUInteger)index
{
    NSData *data = nil;
    NSString *recordingDirectory = [LPCRecordingSession recordingDirectory];
    NSURL *dd = [NSURL URLWithString:recordingDirectory];
    NSString *filename = [self nameForAttachmentAtIndex:index];
    if (filename) {
        NSURL *fileURL = [NSURL fileURLWithPath:[dd.absoluteString stringByAppendingPathComponent:filename]];
        data = [NSData dataWithContentsOfURL:fileURL];
    }
    return data;
}

@end
