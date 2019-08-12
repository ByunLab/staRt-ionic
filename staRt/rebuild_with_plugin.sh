echo "Rebuilding the audio plugin and the app"
echo "You may need to run 'sudo xcode-select -s /Applications/Xcode.app/Contents/Developer' first."
current_dir=$PWD;
cd ../audio-plugin/src/ios/AudioPlugin/;
xcodebuild build -project AudioPlugin.xcodeproj -scheme UniversalLib
cd $current_dir;
cordova plugin remove site.girlfriends.start.audio
cordova plugin add ../audio-plugin
ionic build
