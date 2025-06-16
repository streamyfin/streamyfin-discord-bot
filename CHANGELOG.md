# [2.2.0](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.1.2...v2.2.0) (2025-06-16)


### Bug Fixes

* **ci:** fetch full git history to fix commit diff detection in workflow ([e417144](https://github.com/streamyfin/streamyfin-discord-bot/commit/e417144ddbea622f695e4bc038e3e2711dcfd854))
* **commitlint:** rename config file to .cjs to fix ESM loading issue in CI ([bd58522](https://github.com/streamyfin/streamyfin-discord-bot/commit/bd58522b7aadcd86483329b1e52da84fb6fb3314))
* **lang:** improve language detection reliability and trolling conditions ([9cf6a6a](https://github.com/streamyfin/streamyfin-discord-bot/commit/9cf6a6a8b85c3cdc7c8c295bf91d5605f9b5b776))
* trigger release for workflow changes ([c63b6f1](https://github.com/streamyfin/streamyfin-discord-bot/commit/c63b6f12b9f1919516c7b5d914d04aca13ba04b6))


### Features

* **ci:** add semantic-release with conditional Docker deploy ([08a3e87](https://github.com/streamyfin/streamyfin-discord-bot/commit/08a3e87ae9668e835a1cfe89e710c6bbb1e407df))
* **husky:** add semantic-release skip condition ([e899f27](https://github.com/streamyfin/streamyfin-discord-bot/commit/e899f2768b61cd022cd07745f1c3ab4e2ccfcaef))

## [2.1.2](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.1.1...v2.1.2) (2025-06-12)



## [2.1.1](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.0.1...v2.1.1) (2025-06-04)


### Features

* **help:** Improve help text and remove the feature causing the bot to respond when mentioned. ([0b7d4c8](https://github.com/streamyfin/streamyfin-discord-bot/commit/0b7d4c891f48e655d594c1680cbf4b96601d8678))



# [2.1.0](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.0.0...v2.1.0) (2025-06-01)


### Bug Fixes

* add missing negation to troll check in language logic ([f5db820](https://github.com/streamyfin/streamyfin-discord-bot/commit/f5db8208caa00cfc9a428f4b228bf44aa20f5fa9))


### Features

* ignore certain channels and troll people ([2b6ed1c](https://github.com/streamyfin/streamyfin-discord-bot/commit/2b6ed1c7e0a1319f4e10f9e1e81ec7523c0b29d7))
* ignore certain channels and troll people ([9f71445](https://github.com/streamyfin/streamyfin-discord-bot/commit/9f714456b48f194c0e8285e76836c6c948d8d96b))



## [2.0.1](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.1.0...v2.0.1) (2025-06-02)


### Bug Fixes

* Fix Syntax Error in piracyKeywords Array ([eb912c5](https://github.com/streamyfin/streamyfin-discord-bot/commit/eb912c50f5c3382fa11d2054e4c34228fa22f823))



# [2.1.0](https://github.com/streamyfin/streamyfin-discord-bot/compare/v2.0.0...v2.1.0) (2025-06-01)


### Bug Fixes

* add missing negation to troll check in language logic ([f5db820](https://github.com/streamyfin/streamyfin-discord-bot/commit/f5db8208caa00cfc9a428f4b228bf44aa20f5fa9))
* add missing Ollama URL ([7904deb](https://github.com/streamyfin/streamyfin-discord-bot/commit/7904debbaf0fdb2a80f51703d136cc2e80f3d82a))
* eldr ([7f57240](https://github.com/streamyfin/streamyfin-discord-bot/commit/7f5724073c621c4ac0ebc570f6aeb14c19fc7f67))
* node version ([ff56440](https://github.com/streamyfin/streamyfin-discord-bot/commit/ff56440661b35d0b3f762e4aaa3ed735cbdae778))
* remove eldr ([909ecad](https://github.com/streamyfin/streamyfin-discord-bot/commit/909ecadd9504e4effdd509fd42b9bb1168da3fd1))
* switched eld with eldr ([4c333e5](https://github.com/streamyfin/streamyfin-discord-bot/commit/4c333e5ff411ce454b4400cb1d6689c159d73081))
* updated redis ([fe884c4](https://github.com/streamyfin/streamyfin-discord-bot/commit/fe884c477f9b8c068283c6910b23edf3382fa1fa))


### Features

* add input sanitization to translation prompt for improved security ([8ed901c](https://github.com/streamyfin/streamyfin-discord-bot/commit/8ed901cc2ba5309112471f3b3c1508a1bfcdfa04))
* Added several new entries and removed outdated or redundant keywords from the piracyKeywords array. Adjusted formatting to maintain consistent six entries per line for clarity and easier future updates. ([#12](https://github.com/streamyfin/streamyfin-discord-bot/issues/12)) ([e024242](https://github.com/streamyfin/streamyfin-discord-bot/commit/e0242429460e79dade170bfb09b20d6ca98e2d98))
* ignore certain channels and troll people ([2b6ed1c](https://github.com/streamyfin/streamyfin-discord-bot/commit/2b6ed1c7e0a1319f4e10f9e1e81ec7523c0b29d7))
* ignore certain channels and troll people ([9f71445](https://github.com/streamyfin/streamyfin-discord-bot/commit/9f714456b48f194c0e8285e76836c6c948d8d96b))



# [2.0.0](https://github.com/streamyfin/streamyfin-discord-bot/compare/v1.7.1...v2.0.0) (2025-05-29)


### Bug Fixes

* **hasPiracy:** expanded piracy keywords list and ensured isToxic was defined ([eab7ef0](https://github.com/streamyfin/streamyfin-discord-bot/commit/eab7ef049882232590f3a518eca844335140d349))
* **hasPiracy:** update piracy keywords list for improved detection ([00d5e80](https://github.com/streamyfin/streamyfin-discord-bot/commit/00d5e80c32d61722c50a981598c19e8d67b82131))


### Features

* add wyci command to address feature inquiries. ([cfa2173](https://github.com/streamyfin/streamyfin-discord-bot/commit/cfa217374c0b010842c5ecf45083107ca9027857))
* remindme command ([#9](https://github.com/streamyfin/streamyfin-discord-bot/issues/9)) ([5fa4afd](https://github.com/streamyfin/streamyfin-discord-bot/commit/5fa4afd661a51bf5112aaae210fe6643b10fee4b))



## [1.7.1](https://github.com/streamyfin/streamyfin-discord-bot/compare/51871b9d91060b4508b6cf13fbe03f77ca311a01...v1.7.1) (2025-04-27)


### Bug Fixes

* add missing GitHub API URL ([1329b34](https://github.com/streamyfin/streamyfin-discord-bot/commit/1329b348bcf46b4c1c4f4d98953b057397ff0dec))
* add missing GitHub API URL ([50b9685](https://github.com/streamyfin/streamyfin-discord-bot/commit/50b96857d55c6ff366ea2538ce14842016ba385d))
* better grammar ([1242b2f](https://github.com/streamyfin/streamyfin-discord-bot/commit/1242b2f9f4a5a71ab4e5a2316277ab209863b59f))
* changed env to REPO_ORG ([e1db2d3](https://github.com/streamyfin/streamyfin-discord-bot/commit/e1db2d36c00febcab5d2e756491771cc47134281))
* command registration ([4a07823](https://github.com/streamyfin/streamyfin-discord-bot/commit/4a07823a0751fdbcfaa276b0b8e24b358bb17b38))
* command registration ([8f82669](https://github.com/streamyfin/streamyfin-discord-bot/commit/8f826693b0ba50f6663b23b0af3a1665f3a5a609))
* Corrected the GitHub API URL and headers in fetchReleases method. ([114054e](https://github.com/streamyfin/streamyfin-discord-bot/commit/114054e08d394ca25f639db9ad1e983823ea2bba))
* Corrected the GitHub API URL and headers in fetchReleases method. ([68c7dff](https://github.com/streamyfin/streamyfin-discord-bot/commit/68c7dffec988bae3ac92e94f46b0bf32fcce6bd5))
* Corrected variable usage in featurerequest command ([b95fa4c](https://github.com/streamyfin/streamyfin-discord-bot/commit/b95fa4c7e53151c91a88419bad8e707fdcb1960a))
* Corrected variable usage in featurerequest command. ([aec5ef4](https://github.com/streamyfin/streamyfin-discord-bot/commit/aec5ef481e75fedc5b6ac36158b8d2d7e1f01d30))
* Define userId globally to avoid reference errors ([06d94bc](https://github.com/streamyfin/streamyfin-discord-bot/commit/06d94bce12a526641e33fbcae9ae0212a38d3316))
* Define userId globally to avoid reference errors ([be31f0b](https://github.com/streamyfin/streamyfin-discord-bot/commit/be31f0b2dc6f6c1a48ef916c88a2a6f3ab9fd0fd))
* docker compose file now uses image deployed on docker hub ([389b0fb](https://github.com/streamyfin/streamyfin-discord-bot/commit/389b0fbae54a7ec07d5e91ec3b9d3a1884261eb5))
* English code comments ([1dff5d7](https://github.com/streamyfin/streamyfin-discord-bot/commit/1dff5d76bae3d12e288ba8b4c3ea216b097e8902))
* improve support command formatting ([21eae10](https://github.com/streamyfin/streamyfin-discord-bot/commit/21eae109053fed968c8853b4f3afb16ccfc9e197))
* marked tv command as done ([4b6989c](https://github.com/streamyfin/streamyfin-discord-bot/commit/4b6989cbb154214997f15e86a8dde1cb2703cb11))
* README Header ([24ca6ae](https://github.com/streamyfin/streamyfin-discord-bot/commit/24ca6ae5e7956f9b0db5e4c733e4d14b89334220))
* README Header ([d7dfdcf](https://github.com/streamyfin/streamyfin-discord-bot/commit/d7dfdcf47c1abc27fd3e0e15689f352a015dc475))
* remove trailing comma ([23cdac1](https://github.com/streamyfin/streamyfin-discord-bot/commit/23cdac16836824d2c97acd1258a8dab5731dfa7a))
* remove trailing comma ([06c2ff8](https://github.com/streamyfin/streamyfin-discord-bot/commit/06c2ff89478867fa578c0db9e9c78620d66d666f))
* repo_owner and new API key ([919518d](https://github.com/streamyfin/streamyfin-discord-bot/commit/919518db9f9043b62c34b36b31ee8a5fb20e8e7a))
* repo_owner and new API key ([a8dfb84](https://github.com/streamyfin/streamyfin-discord-bot/commit/a8dfb8431cc1e51bd24b2cb2d66aa1812ff53a8c))
* roadmap link ([2123a79](https://github.com/streamyfin/streamyfin-discord-bot/commit/2123a7913ed03b8ca04f6363f4eb0b84ee5668d5))
* TODO.md ([8b84f46](https://github.com/streamyfin/streamyfin-discord-bot/commit/8b84f465254823028327f65f38ad9bf1f2bda79c))
* TODO.md ([4b50872](https://github.com/streamyfin/streamyfin-discord-bot/commit/4b5087202d6b8a828bab179487338f6787cec5d0))
* TODO.md ([a4c18cd](https://github.com/streamyfin/streamyfin-discord-bot/commit/a4c18cdd4332487a7bdc84048623b968770cbed2))
* typo ([6c17931](https://github.com/streamyfin/streamyfin-discord-bot/commit/6c17931bc9b6310a56323520eaee3aa0002fb2d0))
* typo ([82d838d](https://github.com/streamyfin/streamyfin-discord-bot/commit/82d838d5c397e5c205f82e046f7e3b171f1f77d4))
* updated env.example ([2c64183](https://github.com/streamyfin/streamyfin-discord-bot/commit/2c64183215cd8da1856fc12e1563467ed69d5188))
* **version:** correct project version in package.json ([f967dfd](https://github.com/streamyfin/streamyfin-discord-bot/commit/f967dfd502b77598fff1c655417448a76e907283))


### Features

* Add command to create a thread for feature requests ([367d6fe](https://github.com/streamyfin/streamyfin-discord-bot/commit/367d6fef888fe7e74cac5bbe1549439be8fee4b9))
* Add command to create a thread for feature requests ([51871b9](https://github.com/streamyfin/streamyfin-discord-bot/commit/51871b9d91060b4508b6cf13fbe03f77ca311a01))
* Add event listener to respond to messages mentioning the bot ([24cc188](https://github.com/streamyfin/streamyfin-discord-bot/commit/24cc18846c8106d43051383d2b045f948eab2dd9))
* Add initial implementation of 'tv' command. ([0eb67c2](https://github.com/streamyfin/streamyfin-discord-bot/commit/0eb67c29ba8d42f487b121e77d20ed71b1d3b3b3))
* Add message toxicity analysis and enhance piracy keyword detection ([a2c04fa](https://github.com/streamyfin/streamyfin-discord-bot/commit/a2c04fa1c10b2973813b7bc91408364e24c4f267))
* add piracy command and improve bot responses ([187779b](https://github.com/streamyfin/streamyfin-discord-bot/commit/187779b1107a1c0811a97f7e3dfb2267f674d0e6))
* add piracy command and improve bot responses ([125a98a](https://github.com/streamyfin/streamyfin-discord-bot/commit/125a98a7fcc2d04640536aa24937449d056b3bda))
* add proper README ([cbb0d0c](https://github.com/streamyfin/streamyfin-discord-bot/commit/cbb0d0c0b812ddc6fc75024cdd8b59c2f5cb1629))
* add proper README ([b18e0d6](https://github.com/streamyfin/streamyfin-discord-bot/commit/b18e0d699260eaf3750f256fafcf4289e234c11f))
* Added a feature to send a warning message one minute before deleting a thread after closing a GitHub issue. Updated the closeissue command to include this functionality. ([5a002fd](https://github.com/streamyfin/streamyfin-discord-bot/commit/5a002fd3866ed9e5865d2862b4bf6281039ee77a))
* **ci:** deploy docker images with version from package.json and latest tag ([baf8b17](https://github.com/streamyfin/streamyfin-discord-bot/commit/baf8b1735dbc67403e626a450032a4555883fa94))
* **commands:** add new `/support` command with detailed support guidelines ([81c4838](https://github.com/streamyfin/streamyfin-discord-bot/commit/81c4838b3729a285508e00865c5b85a89e4cfa34))
* create deploy.yml ([e888ad7](https://github.com/streamyfin/streamyfin-discord-bot/commit/e888ad7e02bf12a3f5acefe6f8b23215823d851f))
* Enhance '/repo' command to display repository details and allow selection from a list & added a keyword blacklist ([2b245be](https://github.com/streamyfin/streamyfin-discord-bot/commit/2b245bec87138a0f4ca705686d5cdd04ceb02288))
* enhance GitHub issue retrieval and add activity status ([0af005d](https://github.com/streamyfin/streamyfin-discord-bot/commit/0af005d720cb34f62cd7c9311fe79ffd4d0fdf6b))
* enhance GitHub issue retrieval and add activity status ([8f49bd5](https://github.com/streamyfin/streamyfin-discord-bot/commit/8f49bd5987c235f9f9eccb6bdc7e71e9710877e6))
* Implement repository existence check and update GitHub commands to use it ([0eb406c](https://github.com/streamyfin/streamyfin-discord-bot/commit/0eb406cc7f56ed82dca4d2c411a20982b353af3c))
* new command descriptions ([26a37f9](https://github.com/streamyfin/streamyfin-discord-bot/commit/26a37f97f1624432cbe545d688cc1213b60af74e))
* removed unnecessary code in closeissue.js ([ba9737c](https://github.com/streamyfin/streamyfin-discord-bot/commit/ba9737ccf35e905b588fed4feb6652c58aeef78d))
* Update featurerequest command to include description option ([3b309e1](https://github.com/streamyfin/streamyfin-discord-bot/commit/3b309e1a3a7447d35567b05635e5179aa5a81ade))
* Update featurerequest command to include description option ([fd2ac35](https://github.com/streamyfin/streamyfin-discord-bot/commit/fd2ac357b2d5a8b1272ba34a7dad7e79f18965f7))
