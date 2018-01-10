#!/bin/sh
# security create-keychain -p travis ios-build.keychain
security import ./ios_distribution.cer -k ~/Library/Keychains/login.keychain -T /usr/bin/codesign
security import ./dist.p12 -k ~/Library/Keychains/login.keychain -P 123456 -T /usr/bin/codesign
mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
cp ./profile/hocEDisco.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
