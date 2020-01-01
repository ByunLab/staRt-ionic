//
//  LPCProfileDescription.m
//  AudioPlugin
//
//  Created by Sam Tarakajian on 5/25/16.
//  Copyright © 2016 Girlfriends Labs. All rights reserved.
//

#import "LPCProfileDescription.h"
#import "CHCSVParser.h"

NSString *const LPCProfileDescriptionKeyName = @"name";
NSString *const LPCProfileDescriptionKeyEmail = @"email";
NSString *const LPCProfileDescriptionKeyUUID = @"uuid";
NSString *const LPCProfileDescriptionKeyAge = @"age";
NSString *const LPCProfileDescriptionKeyGender = @"gender";
NSString *const LPCProfileDescriptionKeyHeightFeet = @"heightFeet";
NSString *const LPCProfileDescriptionKeyHeightInches = @"heightInches";
NSString *const LPCProfileDescriptionKeyTargetF3 = @"targetF3";
NSString *const LPCProfileDescriptionKeyStdevF3 = @"stdevF3";
NSString *const LPCProfileDescriptionKeyTargetLPCOrder = @"targetLPCOrder";

static NSArray *metadataParams;

@interface LPCProfileDescription ()
@property (nonatomic, strong) NSString *uuid;
@property (nonatomic, strong) NSDictionary *metadata;
@property (nonatomic, assign) double targetF3;
@property (nonatomic, assign) double stdevF3;
@property (nonatomic, assign) NSInteger targetLPCOrder;
@property (nonatomic, strong) NSMutableDictionary *mutableMetadata;
@end

@implementation LPCProfileDescription

+ (void) initialize
{
    metadataParams = @[
                       LPCProfileDescriptionKeyName,
					   LPCProfileDescriptionKeyEmail,
                       LPCProfileDescriptionKeyAge,
                       LPCProfileDescriptionKeyGender,
                       LPCProfileDescriptionKeyHeightFeet,
                       LPCProfileDescriptionKeyHeightInches
                       ];
}

+ (instancetype) accountDescriptionWithDictionary:(NSDictionary *)dictionary
{
    LPCProfileDescription *desc = [[LPCProfileDescription alloc] init];
    desc.mutableMetadata = [NSMutableDictionary dictionary];
    for (NSString *key in dictionary.keyEnumerator) {
        if ([metadataParams containsObject:key]) {
            [desc.mutableMetadata setObject:[dictionary objectForKey:key]
                                     forKey:key];
        } else {
            [desc setValue:[dictionary objectForKey:key] forKeyPath:key];
        }
    }
    return desc;
}

+ (instancetype) accountDescriptionWithRecordingMetadataURL:(NSURL *)url
{
    NSArray<CHCSVOrderedDictionary *> *rows = [NSArray arrayWithContentsOfCSVURL:url options:CHCSVParserOptionsUsesFirstLineAsKeys|CHCSVParserOptionsSanitizesFields|CHCSVParserOptionsTrimsWhitespace];
    if (!rows)
        return nil;
    LPCProfileDescription *desc = [[LPCProfileDescription alloc] init];
    desc.mutableMetadata = [NSMutableDictionary dictionary];
    desc.uuid = [rows[0] objectForKey:@"uuid"];

	if ([rows[0] objectForKey:@"email"]) {
		[desc.mutableMetadata setObject:[rows[0] objectForKey:@"email"] forKey:LPCProfileDescriptionKeyEmail];
	}

    [desc.mutableMetadata setObject:[rows[0] objectForKey:@"username"] forKey:LPCProfileDescriptionKeyName];
    [desc.mutableMetadata setObject:[rows[0] objectForKey:@"age"] forKey:LPCProfileDescriptionKeyAge];
    [desc.mutableMetadata setObject:[rows[0] objectForKey:@"gender"] forKey:LPCProfileDescriptionKeyGender];
    [desc.mutableMetadata setObject:[rows[0] objectForKey:@"heightFeet"] forKey:LPCProfileDescriptionKeyHeightFeet];
    [desc.mutableMetadata setObject:[rows[0] objectForKey:@"heightInches"] forKey:LPCProfileDescriptionKeyHeightInches];
    desc.targetF3 = [[rows[0] objectForKey:@"targetF3"] doubleValue];
    desc.stdevF3 = [[rows[0] objectForKey:@"stdevF3"] doubleValue];
    desc.targetLPCOrder = [[rows[0] objectForKey:@"targetLPCOrder"] integerValue];
    return desc;
}

-  (NSDictionary *) metadata
{
    return self.mutableMetadata;
}

// Just in case javascript sends us a poorly formatted dictionary, we don't necessarily want to vomit an exception
- (void) setValue:(id)value forUndefinedKey:(NSString *)key {

}

@end
