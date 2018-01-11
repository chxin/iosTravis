#!/bin/sh
# security delete-keychain ios-build.keychain
# rm -f ~/Library/MobileDevice/Provisioning\ Profiles/hocEDisco.mobileprovision

security create-keychain -p travis ios-build.keychain
# security default-keychain -s ios-build.keychain

security unlock-keychain -p travis ios-build.keychain
security set-keychain-setting -t 3600 -l ~/Library/Keychains/ios-build.keychain

security import ./ios_distribution.cer -A -k ~/Library/Keychains/ios-build.keychain -T /usr/bin/codesign
security import ./dist.p12 -k ~/Library/Keychains/ios-build.keychain -A -P 123456 -T /usr/bin/codesign

mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp ./profile/hocEDisco.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/

security find-identity -p codesigning ~/Library/Keychains/ios-build.keychain
security list-keychains
