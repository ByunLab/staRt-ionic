#!/bin/sh

# Welcome to the build_ios script! 
# (1) Runs ionic build 
# (2) Boots an ios simulator of your choice
# (3) Builds the staRt project
# (4) Loads the staRt project onto the simulator.
# Essentially... this script runs ionic build and then performs the steps that
# xcode normally does for you when you hit the play button. 
# Note: If you wish to update the audio plugin you still must run rebuild_with_plugin.sh

# Viewing console debug: If you want to see the console output of the simulator, then you have
# to open up Safari, go to Preferences -> Advanced -> Check "Show Develop menu in menu bar"
# Now when the simulator is running you can open safari and click Develop->Simulator->staRt->Profiles.
# ..It's strange that you need to open Safari to see the console of the simulator program, I know.


# To set DEVICE_HEX run
# xcrun sctl list
# pick the value that looks like 344211B6-3061-4329-96E1-692E684DE853 for the device you want to run
# Example/My value:
# DEVICE_HEX=344211B6-3061-4329-96E1-692E684DE853

# To get the BUILD_OUTPUT_FOLDER is more complicated. You need to run
# xcodebuild build -scheme staRt -configuration Debug -project staRt.xcodeproj -sdk iphonesimulator
# While inside of staRt/platforms/ios
# then you need to search for a folder inside of ~/Library/Developer/Xcode/DerivedData/
# that looks like staRt- followed by a bunch of characters. Inside of the staRt-woeifjwoejf folder
# will be a path /Build/Products/Debug-iphonesimulator/staRt.app
# You need the entire path to staRt.app
# Example/My value:
# BUILD_OUTPUT_FOLDER=~/Library/Developer/Xcode/DerivedData/staRt-bdydtgivrwfgvpgbxtkzobweqjzf/Build/Products/Debug-iphonesimulator/staRt.app

if  [[ -z "${DEVICE_HEX}" ]] || [[ -z "${BUILD_OUTPUT_FOLDER}" ]]
then
		echo "DEVICE_HEX and/or BUILD_OUTPUT_FOLDER env variables not set. Please read the build_ios.sh script for more details"
		exit 1;
fi

ionic build;

# Often times the device will already booted and this will fail, no worries.
xcrun simctl boot $DEVICE_HEX; 

# Build the staRt app after ionic build made it ready for xcodebuild. 
current_dir=$PWD;
cd ./platforms/ios/;
xcodebuild build -scheme staRt -configuration Debug -project staRt.xcodeproj -sdk iphonesimulator
cd $current_dir;

# Install the built app onto the DEVICE_HEX we chose.
xcrun simctl install $DEVICE_HEX $BUILD_OUTPUT_FOLDER

# Open the simulator
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/

# Open the app inside the simulator
xcrun simctl launch $DEVICE_HEX com.ionicframework.start925154

# TODO Open up safari to debug page.
