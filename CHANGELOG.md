# [1.25.0](https://github.com/lenneTech/deploy.party/compare/v1.24.0...v1.25.0) (2025-07-24)


### Features

* update tag pattern handling to sanitize special characters for path-like format ([d3a5cac](https://github.com/lenneTech/deploy.party/commit/d3a5cac660a675716f7e5bcd8fbb146fb943116a))

# [1.24.0](https://github.com/lenneTech/deploy.party/compare/v1.23.0...v1.24.0) (2025-07-24)


### Features

* update tag pattern handling to normalize regex for container deployments ([ddb458d](https://github.com/lenneTech/deploy.party/commit/ddb458da4f50915fcf2eeaf01aabb30d14d87d41))

# [1.23.0](https://github.com/lenneTech/deploy.party/compare/v1.22.0...v1.23.0) (2025-07-24)


### Features

* fix tag retrieval logic to correctly handle path condition for PATTERN match type ([26cc4dd](https://github.com/lenneTech/deploy.party/commit/26cc4ddbab4dfa356216bf610dcd8d50f4af91a1))

# [1.22.0](https://github.com/lenneTech/deploy.party/compare/v1.21.0...v1.22.0) (2025-07-24)


### Features

* enhance container source retrieval to support tag pattern matching ([7f20385](https://github.com/lenneTech/deploy.party/commit/7f20385b8775f1cd2b6bef6af2686c11cac3c6e2))

# [1.21.0](https://github.com/lenneTech/deploy.party/compare/v1.20.0...v1.21.0) (2025-07-24)


### Features

* refresh container tag for TAG deployment type with PATTERN match type ([1407528](https://github.com/lenneTech/deploy.party/commit/140752845d6b9b20071e1f876d76373e4ffb6aa3))

# [1.20.0](https://github.com/lenneTech/deploy.party/compare/v1.19.0...v1.20.0) (2025-07-24)


### Features

* add support for release events in GitLab webhook configuration ([b8410c0](https://github.com/lenneTech/deploy.party/commit/b8410c05aecff17a0aef5fa9df5fa5b993ad5603))

# [1.19.0](https://github.com/lenneTech/deploy.party/compare/v1.18.0...v1.19.0) (2025-07-24)


### Features

* add tag pattern support and skip CI patterns for container deployments ([2824317](https://github.com/lenneTech/deploy.party/commit/28243175d24826dbffcc4e140907fffb25e46205))

# [1.18.0](https://github.com/lenneTech/deploy.party/compare/v1.17.0...v1.18.0) (2025-07-14)


### Features

* enhance install script with command line arguments and interactive prompts ([f211a0c](https://github.com/lenneTech/deploy.party/commit/f211a0c171efebdb0f33164c82c8a42380c7efa4))

# [1.17.0](https://github.com/lenneTech/deploy.party/compare/v1.16.1...v1.17.0) (2025-07-10)


### Features

* add deployment type selection and auto deploy option in CustomForm component ([ae402cd](https://github.com/lenneTech/deploy.party/commit/ae402cd648c98516ac847836026aac1ebdcc02c2))

## [1.16.1](https://github.com/lenneTech/deploy.party/compare/v1.16.0...v1.16.1) (2025-07-10)


### Bug Fixes

* simplify submission validation logic in CustomForm component ([6019d6e](https://github.com/lenneTech/deploy.party/commit/6019d6e485ec6e9ee5a12ab226ea099c4e0240a9))

# [1.16.0](https://github.com/lenneTech/deploy.party/compare/v1.15.1...v1.16.0) (2025-06-26)


### Features

* add support for container volumes in application form and related models ([01aeb77](https://github.com/lenneTech/deploy.party/commit/01aeb77bb4a7e124f3b0f9517361b0342543e346))

## [1.15.1](https://github.com/lenneTech/deploy.party/compare/v1.15.0...v1.15.1) (2025-05-15)


### Bug Fixes

* set default environment variables for Redis UI service ([9364154](https://github.com/lenneTech/deploy.party/commit/936415493720e8589e7423d006d14c87d14eb194))

# [1.15.0](https://github.com/lenneTech/deploy.party/compare/v1.14.3...v1.15.0) (2025-05-15)


### Features

* add Redis UI service support and update related configurations ([6eb49c0](https://github.com/lenneTech/deploy.party/commit/6eb49c01c08a3de5f17a2e8d0acea0db357e0482))

## [1.14.3](https://github.com/lenneTech/deploy.party/compare/v1.14.2...v1.14.3) (2025-05-13)


### Bug Fixes

* add timezone configuration for MongoDB service ([c086eef](https://github.com/lenneTech/deploy.party/commit/c086eef6137614bfd443de98e59089f40ad9ceea))

## [1.14.2](https://github.com/lenneTech/deploy.party/compare/v1.14.1...v1.14.2) (2025-05-07)


### Bug Fixes

* enable MongoDB admin access in docker.service.ts ([efd2729](https://github.com/lenneTech/deploy.party/commit/efd272906358bf47877f8cf1a51b23730b198f8c))

## [1.14.1](https://github.com/lenneTech/deploy.party/compare/v1.14.0...v1.14.1) (2025-05-07)


### Bug Fixes

* update environment variable formatting in docker.service.ts ([603b8e9](https://github.com/lenneTech/deploy.party/commit/603b8e9ffcf4d89e236bff8b7be9760d83cc1259))

# [1.14.0](https://github.com/lenneTech/deploy.party/compare/v1.13.0...v1.14.0) (2025-05-07)


### Features

* add MongoExpress service support and update related configurations ([48f26e1](https://github.com/lenneTech/deploy.party/commit/48f26e1b5d9cb0f2fe45bd693c7153f6b95cedbe))

# [1.13.0](https://github.com/lenneTech/deploy.party/compare/v1.12.2...v1.13.0) (2025-05-07)


### Features

* add PostgreSQL service and configure environment variables for RocketAdmin ([5acab3b](https://github.com/lenneTech/deploy.party/commit/5acab3b8cc63564a483319ac807af2cde9b80784))

## [1.12.2](https://github.com/lenneTech/deploy.party/compare/v1.12.1...v1.12.2) (2025-05-07)


### Bug Fixes

* replace crypto import with randomBytes for key generation in docker.service.ts ([c1d659e](https://github.com/lenneTech/deploy.party/commit/c1d659ef00159bdc97e3a9a8875f7e2b6ff9e1c6))

## [1.12.1](https://github.com/lenneTech/deploy.party/compare/v1.12.0...v1.12.1) (2025-05-07)


### Bug Fixes

* remove duplicate crypto import in docker.service.ts ([8877bdf](https://github.com/lenneTech/deploy.party/commit/8877bdfb8607ac2c595e67987ed42bff29f15e1e))

# [1.12.0](https://github.com/lenneTech/deploy.party/compare/v1.11.0...v1.12.0) (2025-05-07)


### Features

* add ROCKET_ADMIN to container types enumeration ([7767b31](https://github.com/lenneTech/deploy.party/commit/7767b31ec50b0ff691c9b56a18b1606bbc86a9c1))

# [1.11.0](https://github.com/lenneTech/deploy.party/compare/v1.10.10...v1.11.0) (2025-05-07)


### Features

* add support for RocketAdmin service and configure environment variables ([b37d21e](https://github.com/lenneTech/deploy.party/commit/b37d21ed24035956dce928f58d9ea5ee165b5f7f))

## [1.10.10](https://github.com/lenneTech/deploy.party/compare/v1.10.9...v1.10.10) (2025-05-06)


### Bug Fixes

* update Traefik service port to 80 and enable basic auth on container mount ([83cd644](https://github.com/lenneTech/deploy.party/commit/83cd644e9a6e7ace6c4a72468f48156713b6f8e3))

## [1.10.9](https://github.com/lenneTech/deploy.party/compare/v1.10.8...v1.10.9) (2025-05-06)


### Bug Fixes

* remove unnecessary redirect middleware from Adminer configuration ([dfa3a35](https://github.com/lenneTech/deploy.party/commit/dfa3a35166792705bf55885f023e983a366a76ac))

## [1.10.8](https://github.com/lenneTech/deploy.party/compare/v1.10.7...v1.10.8) (2025-05-06)


### Bug Fixes

* implement basic auth support in Adminer configuration and update form schema ([9bfb1c4](https://github.com/lenneTech/deploy.party/commit/9bfb1c4a4e2ee3fe28a11c5aa887171ab0b59e47))

## [1.10.7](https://github.com/lenneTech/deploy.party/compare/v1.10.6...v1.10.7) (2025-03-28)


### Bug Fixes

* rename SMTP_AUTH_PASSWORD to SMTP_AUTH_PASS for consistency ([7b0573c](https://github.com/lenneTech/deploy.party/commit/7b0573cc62b30f98b69304d32c36887d5e97374e))

## [1.10.6](https://github.com/lenneTech/deploy.party/compare/v1.10.5...v1.10.6) (2025-03-11)


### Bug Fixes

* add labels for container deployment and write environment variables to .env file ([e184ea1](https://github.com/lenneTech/deploy.party/commit/e184ea15c3813cc8caeea520b015a4574d184e6f))

## [1.10.5](https://github.com/lenneTech/deploy.party/compare/v1.10.4...v1.10.5) (2025-03-10)


### Bug Fixes

* format environment variable assignment in docker service for better readability ([a113834](https://github.com/lenneTech/deploy.party/commit/a113834eca9169a3bf42f3c473850072509381b8))

## [1.10.4](https://github.com/lenneTech/deploy.party/compare/v1.10.3...v1.10.4) (2025-03-10)


### Bug Fixes

* update condition for displaying .env file content based on container status ([d8aa5a5](https://github.com/lenneTech/deploy.party/commit/d8aa5a57a6cfbf017bceab9dacea08a707dcf1f8))

## [1.10.3](https://github.com/lenneTech/deploy.party/compare/v1.10.2...v1.10.3) (2025-03-10)


### Bug Fixes

* allow nullable environment variable in ServiceForm ([df906b5](https://github.com/lenneTech/deploy.party/commit/df906b59a1782e9edbd77e132b716ebb67203d2a))

## [1.10.2](https://github.com/lenneTech/deploy.party/compare/v1.10.1...v1.10.2) (2025-03-10)


### Bug Fixes

* update environment variable format in docker service ([2f78bcc](https://github.com/lenneTech/deploy.party/commit/2f78bcc7b9099f698d71414cbb4fe3059f39375d))

## [1.10.1](https://github.com/lenneTech/deploy.party/compare/v1.10.0...v1.10.1) (2025-03-10)


### Bug Fixes

* update condition for displaying .env file content in ServiceForm ([727f935](https://github.com/lenneTech/deploy.party/commit/727f9352b147a6780d2584d1f84fb77776f716dd))

# [1.10.0](https://github.com/lenneTech/deploy.party/compare/v1.9.0...v1.10.0) (2025-03-10)


### Features

* move environment variable generation for directus to docker service ([98b7abf](https://github.com/lenneTech/deploy.party/commit/98b7abf5b24a8382d5457b03b3fb0e5b7c524137))

# [1.9.0](https://github.com/lenneTech/deploy.party/compare/v1.8.17...v1.9.0) (2025-03-10)


### Features

* add environment variable configuration for directus container ([535ccd1](https://github.com/lenneTech/deploy.party/commit/535ccd1ad6d7d8212390f6353ec2a31873654681))

## [1.8.17](https://github.com/lenneTech/deploy.party/compare/v1.8.16...v1.8.17) (2025-02-26)


### Bug Fixes

* **DEV-79:** Fix compose for directus ([c387127](https://github.com/lenneTech/deploy.party/commit/c387127fc18af462088489795663c2352ef92643))

## [1.8.16](https://github.com/lenneTech/deploy.party/compare/v1.8.15...v1.8.16) (2025-02-20)


### Bug Fixes

* fix container static error ([6ff5a2d](https://github.com/lenneTech/deploy.party/commit/6ff5a2d0f3d73c36ef07574b5857fef6b7e4a9e0))

## [1.8.15](https://github.com/lenneTech/deploy.party/compare/v1.8.14...v1.8.15) (2025-02-13)


### Bug Fixes

* fix directus service ([65230c2](https://github.com/lenneTech/deploy.party/commit/65230c2bef4a08742e42a167a72e82090665dced))

## [1.8.14](https://github.com/lenneTech/deploy.party/compare/v1.8.13...v1.8.14) (2025-02-13)


### Bug Fixes

* fix directus service ([7029809](https://github.com/lenneTech/deploy.party/commit/7029809847a856f683f439ec8d866c3b78d5f570))

## [1.8.13](https://github.com/lenneTech/deploy.party/compare/v1.8.12...v1.8.13) (2025-02-13)


### Bug Fixes

* **DEV-79:** Fix compose for directus ([422209c](https://github.com/lenneTech/deploy.party/commit/422209c5df278f360bbe24f4f7a2e015c917bcb4))

## [1.8.12](https://github.com/lenneTech/deploy.party/compare/v1.8.11...v1.8.12) (2025-02-13)


### Bug Fixes

* **DEV-79:** Fix compose for directus ([b82b7a2](https://github.com/lenneTech/deploy.party/commit/b82b7a24e72ad772e009f4cdcc56068a4e3363b7))

## [1.8.11](https://github.com/lenneTech/deploy.party/compare/v1.8.10...v1.8.11) (2025-02-13)


### Bug Fixes

* **DEV-79:** Fix compose for directus ([9619cd8](https://github.com/lenneTech/deploy.party/commit/9619cd8134148e942ca07b3dacc839b7315c9785))

## [1.8.10](https://github.com/lenneTech/deploy.party/compare/v1.8.9...v1.8.10) (2025-02-12)


### Bug Fixes

* fix deploy db ([b7067a5](https://github.com/lenneTech/deploy.party/commit/b7067a5baa9fa3071d48e2ab6bede7daa059b6d3))

## [1.8.9](https://github.com/lenneTech/deploy.party/compare/v1.8.8...v1.8.9) (2025-02-12)


### Bug Fixes

* fix bug in build list ([c175492](https://github.com/lenneTech/deploy.party/commit/c1754928f7b943ced738c00829df4ffa6e37bb5d))

## [1.8.8](https://github.com/lenneTech/deploy.party/compare/v1.8.7...v1.8.8) (2025-02-12)


### Bug Fixes

* fix deploy of db ([5225c4e](https://github.com/lenneTech/deploy.party/commit/5225c4e4b53eb17e2c3267c8ba782b6bb1ede884))

## [1.8.7](https://github.com/lenneTech/deploy.party/compare/v1.8.6...v1.8.7) (2025-02-06)


### Bug Fixes

* fix pipeline ([82f9a63](https://github.com/lenneTech/deploy.party/commit/82f9a63602c38d01cc59966762e466c6c40844c6))

## [1.8.6](https://github.com/lenneTech/deploy.party/compare/v1.8.5...v1.8.6) (2025-02-06)


### Bug Fixes

* Change order of custom docker image commands ([1a8f3e2](https://github.com/lenneTech/deploy.party/commit/1a8f3e288e5102fbdb1b1ee08e662a00d8b8e642))
* fix pipeline ([1cf113e](https://github.com/lenneTech/deploy.party/commit/1cf113e99e242810067c012e0be2a53f6d56b558))

## [1.8.5](https://github.com/lenneTech/deploy.party/compare/v1.8.4...v1.8.5) (2024-12-23)


### Bug Fixes

* debug delete backup extern ([f029be0](https://github.com/lenneTech/deploy.party/commit/f029be014a4e7bb674926b804df1dafb2953c57b))

## [1.8.4](https://github.com/lenneTech/deploy.party/compare/v1.8.3...v1.8.4) (2024-12-23)


### Bug Fixes

* debug delete backup extern ([1435088](https://github.com/lenneTech/deploy.party/commit/1435088d1d68ad78b0c73e714d7e196f19a1caaf))

## [1.8.3](https://github.com/lenneTech/deploy.party/compare/v1.8.2...v1.8.3) (2024-12-23)


### Bug Fixes

* debug delete backup extern ([93845ac](https://github.com/lenneTech/deploy.party/commit/93845ac3723742dc02b2294d01d7af9661e46c24))

## [1.8.2](https://github.com/lenneTech/deploy.party/compare/v1.8.1...v1.8.2) (2024-12-23)


### Bug Fixes

* fix log ui ([749fb07](https://github.com/lenneTech/deploy.party/commit/749fb07bb5eeb7498f521a616511cea1ce9fac84))

## [1.8.1](https://github.com/lenneTech/deploy.party/compare/v1.8.0...v1.8.1) (2024-12-23)


### Bug Fixes

* fix build ui ([0b90ca3](https://github.com/lenneTech/deploy.party/commit/0b90ca3103d73412eb8e1dad16ac74e4ed821323))

# [1.8.0](https://github.com/lenneTech/deploy.party/compare/v1.7.1...v1.8.0) (2024-12-23)


### Features

* add timezone in env ([8ef764f](https://github.com/lenneTech/deploy.party/commit/8ef764f06820477d29272d3cb3e10bdffaf2c8ab))

## [1.7.1](https://github.com/lenneTech/deploy.party/compare/v1.7.0...v1.7.1) (2024-12-23)


### Bug Fixes

* fix build ui ([cd55d25](https://github.com/lenneTech/deploy.party/commit/cd55d25cfba11dd3f50fb7ae502bc489e985e08d))

# [1.7.0](https://github.com/lenneTech/deploy.party/compare/v1.6.11...v1.7.0) (2024-12-23)


### Features

* Optimizations ([f2abb88](https://github.com/lenneTech/deploy.party/commit/f2abb883e8044c7c41a03ae0b8391e000ce47273))

## [1.6.11](https://github.com/lenneTech/deploy.party/compare/v1.6.10...v1.6.11) (2024-12-23)


### Bug Fixes

* fix ([696f1f4](https://github.com/lenneTech/deploy.party/commit/696f1f40dd7bbe7154888571ccfed2b8603fc881))

## [1.6.10](https://github.com/lenneTech/deploy.party/compare/v1.6.9...v1.6.10) (2024-12-23)


### Bug Fixes

* fix ([21a8fdc](https://github.com/lenneTech/deploy.party/commit/21a8fdce999b43d07afab49e635e4a3c868207c8))

## [1.6.9](https://github.com/lenneTech/deploy.party/compare/v1.6.8...v1.6.9) (2024-12-23)


### Bug Fixes

* fix ([86e4144](https://github.com/lenneTech/deploy.party/commit/86e4144b384f8b3432b9c4615ac10e5a7fa5aba0))

## [1.6.8](https://github.com/lenneTech/deploy.party/compare/v1.6.7...v1.6.8) (2024-12-23)


### Bug Fixes

* fix ([e14a389](https://github.com/lenneTech/deploy.party/commit/e14a389704e40ff7270d7dd2570ea97571ef68f8))

## [1.6.7](https://github.com/lenneTech/deploy.party/compare/v1.6.6...v1.6.7) (2024-12-23)


### Bug Fixes

* fix typo in status ([f7ec166](https://github.com/lenneTech/deploy.party/commit/f7ec166c1ac697192fe411dd0b93ea3e1c26eb20))

## [1.6.6](https://github.com/lenneTech/deploy.party/compare/v1.6.5...v1.6.6) (2024-12-22)


### Bug Fixes

* remove id from callback ([764a155](https://github.com/lenneTech/deploy.party/commit/764a1552452d476ac4bf4c8508050478bcff8e61))

## [1.6.5](https://github.com/lenneTech/deploy.party/compare/v1.6.4...v1.6.5) (2024-12-22)


### Bug Fixes

* fix build for new tag ([0dc993a](https://github.com/lenneTech/deploy.party/commit/0dc993ad6c4aa97e9cf99ba9313fc224a256d6a4))

## [1.6.4](https://github.com/lenneTech/deploy.party/compare/v1.6.3...v1.6.4) (2024-12-22)


### Bug Fixes

* fix build for new tag ([80fd6fa](https://github.com/lenneTech/deploy.party/commit/80fd6fae90031b7a3487e299f886e719e65de578))

## [1.6.3](https://github.com/lenneTech/deploy.party/compare/v1.6.2...v1.6.3) (2024-12-22)


### Bug Fixes

* fix build for new tag ([9e99488](https://github.com/lenneTech/deploy.party/commit/9e99488ce5fd47d6bfac0b6d9349c0c144bf92cd))

## [1.6.2](https://github.com/lenneTech/deploy.party/compare/v1.6.1...v1.6.2) (2024-12-22)


### Bug Fixes

* fix build for new tag ([cd32cdc](https://github.com/lenneTech/deploy.party/commit/cd32cdcf3a01b27b2d6b2abfd6f34dd9a0510e73))

## [1.6.1](https://github.com/lenneTech/deploy.party/compare/v1.6.0...v1.6.1) (2024-12-22)


### Bug Fixes

* fix build for new tag ([a41b1f6](https://github.com/lenneTech/deploy.party/commit/a41b1f6834d568cd8ba1d73556d8ec13daf0bb34))

# [1.6.0](https://github.com/lenneTech/deploy.party/compare/v1.5.0...v1.6.0) (2024-12-22)


### Features

* add try catch for callback ([8a84d04](https://github.com/lenneTech/deploy.party/commit/8a84d0442193c81631b055873b9381dda3b8a6ff))

# [1.5.0](https://github.com/lenneTech/deploy.party/compare/v1.4.10...v1.5.0) (2024-12-22)


### Features

* add try catch for callback ([1edf97a](https://github.com/lenneTech/deploy.party/commit/1edf97ada02366f2714dbb2e522357d7d4fb718c))

## [1.4.10](https://github.com/lenneTech/deploy.party/compare/v1.4.9...v1.4.10) (2024-12-22)


### Bug Fixes

* fixes ([4ef6996](https://github.com/lenneTech/deploy.party/commit/4ef69962c5641ff848d2ca997cf1eb0d37b9b57a))

## [1.4.9](https://github.com/lenneTech/deploy.party/compare/v1.4.8...v1.4.9) (2024-12-22)


### Bug Fixes

* fixes ([8f300a0](https://github.com/lenneTech/deploy.party/commit/8f300a04f1e6cc5824eb028a9afd6d39ce553f1b))

## [1.4.8](https://github.com/lenneTech/deploy.party/compare/v1.4.7...v1.4.8) (2024-12-22)


### Bug Fixes

* fixes ([b56d702](https://github.com/lenneTech/deploy.party/commit/b56d70200831e2d1cb364b3fe37b70020def1a53))

## [1.4.7](https://github.com/lenneTech/deploy.party/compare/v1.4.6...v1.4.7) (2024-12-22)


### Bug Fixes

* fixes ([846e9bd](https://github.com/lenneTech/deploy.party/commit/846e9bd80c9426d952b3df254cbbf2f7866dc9fc))

## [1.4.6](https://github.com/lenneTech/deploy.party/compare/v1.4.5...v1.4.6) (2024-12-22)


### Bug Fixes

* fixes ([fc0b751](https://github.com/lenneTech/deploy.party/commit/fc0b751e2716bdf5240bb934adb749d6144bb158))

## [1.4.5](https://github.com/lenneTech/deploy.party/compare/v1.4.4...v1.4.5) (2024-12-22)


### Bug Fixes

* fixes ([0d23dae](https://github.com/lenneTech/deploy.party/commit/0d23dae475667914af1fe103163f788b5612579c))

## [1.4.4](https://github.com/lenneTech/deploy.party/compare/v1.4.3...v1.4.4) (2024-12-22)


### Bug Fixes

* fixes ([3313a7e](https://github.com/lenneTech/deploy.party/commit/3313a7ebc327d609300f979c4c23d7e4fb8e2c68))

## [1.4.3](https://github.com/lenneTech/deploy.party/compare/v1.4.2...v1.4.3) (2024-12-22)


### Bug Fixes

* fixes ([a5274fe](https://github.com/lenneTech/deploy.party/commit/a5274febd656f03eb6e423d9499da2123c9b81ec))

## [1.4.2](https://github.com/lenneTech/deploy.party/compare/v1.4.1...v1.4.2) (2024-12-22)


### Bug Fixes

* fix build service ([27c7b89](https://github.com/lenneTech/deploy.party/commit/27c7b89cbdc512d058d804798eefd30bb26878f3))

## [1.4.1](https://github.com/lenneTech/deploy.party/compare/v1.4.0...v1.4.1) (2024-12-22)


### Bug Fixes

* fix scripts ([17144eb](https://github.com/lenneTech/deploy.party/commit/17144ebdc07515ac41510ddc2acadcd9ec0fc9a4))
* fix scripts ([a92fa05](https://github.com/lenneTech/deploy.party/commit/a92fa053e910a8f50f476d27bd6f49f1653b14b9))

# [1.4.0](https://github.com/lenneTech/deploy.party/compare/v1.3.1...v1.4.0) (2024-12-21)


### Features

* install script improvements ([113aa08](https://github.com/lenneTech/deploy.party/commit/113aa086e0b73bca8689dfb9598e3fd62eaf9c27))

## [1.3.1](https://github.com/lenneTech/deploy.party/compare/v1.3.0...v1.3.1) (2024-12-21)


### Bug Fixes

* small fixes ([0044f25](https://github.com/lenneTech/deploy.party/commit/0044f25d7728eee4e77a97d64f891602cba360aa))

# [1.3.0](https://github.com/lenneTech/deploy.party/compare/v1.2.0...v1.3.0) (2024-12-21)


### Features

* rename config to template ([af89ee7](https://github.com/lenneTech/deploy.party/commit/af89ee78a62cf1ae3533898feaaabd95526a65a6))

# [1.2.0](https://github.com/lenneTech/deploy.party/compare/v1.1.5...v1.2.0) (2024-12-21)


### Features

* implement project config download and import ([2b8afbc](https://github.com/lenneTech/deploy.party/commit/2b8afbca412fc092cd5a816cc7a62c7473358c1d))

## [1.1.5](https://github.com/lenneTech/deploy.party/compare/v1.1.4...v1.1.5) (2024-12-20)


### Bug Fixes

* fix wrong ports ([1452994](https://github.com/lenneTech/deploy.party/commit/145299451649dec41ca5444383eaa7d631636514))

## [1.1.4](https://github.com/lenneTech/deploy.party/compare/v1.1.3...v1.1.4) (2024-12-20)


### Bug Fixes

* fixes ([8ace47e](https://github.com/lenneTech/deploy.party/commit/8ace47e122bca2efb99ef586367ea90a0231ff39))

## [1.1.3](https://github.com/lenneTech/deploy.party/compare/v1.1.2...v1.1.3) (2024-12-20)


### Bug Fixes

* fixes ([6f274b1](https://github.com/lenneTech/deploy.party/commit/6f274b1bddfa9fab8611f1b318049ebedf71d989))

## [1.1.2](https://github.com/lenneTech/deploy.party/compare/v1.1.1...v1.1.2) (2024-12-20)


### Bug Fixes

* fixes ([590a6cb](https://github.com/lenneTech/deploy.party/commit/590a6cbf8dfc2e8781baf7db109ddf9b722d04e7))

## [1.1.1](https://github.com/lenneTech/deploy.party/compare/v1.1.0...v1.1.1) (2024-12-20)


### Bug Fixes

* format code ([9d7ffd2](https://github.com/lenneTech/deploy.party/commit/9d7ffd26e65cb4602f1c01dba77d84b62a2b5ebe))

# [1.1.0](https://github.com/lenneTech/deploy.party/compare/v1.0.30...v1.1.0) (2024-12-20)


### Features

* update packages ([7f49961](https://github.com/lenneTech/deploy.party/commit/7f49961a2f952cdf1dbcbff5acb1d5d09403dc8a))

## [1.0.30](https://github.com/lenneTech/deploy.party/compare/v1.0.29...v1.0.30) (2024-12-20)


### Bug Fixes

* fixes ([7a78a65](https://github.com/lenneTech/deploy.party/commit/7a78a65e2ed37d48a47f8a4d6153c0989f3b66a5))

## [1.0.29](https://github.com/lenneTech/deploy.party/compare/v1.0.28...v1.0.29) (2024-12-20)


### Bug Fixes

* fixes ([bb87199](https://github.com/lenneTech/deploy.party/commit/bb87199d4ef00f2302daff435be94f8bec691531))

## [1.0.28](https://github.com/lenneTech/deploy.party/compare/v1.0.27...v1.0.28) (2024-12-20)


### Bug Fixes

* debug ([f6f7ebe](https://github.com/lenneTech/deploy.party/commit/f6f7ebe981c769953a521a6188c3116abf6e71cd))

## [1.0.27](https://github.com/lenneTech/deploy.party/compare/v1.0.26...v1.0.27) (2024-12-20)


### Bug Fixes

* debug ([3fe9262](https://github.com/lenneTech/deploy.party/commit/3fe9262702492b6db445b764a9135c84d2510a5f))

## [1.0.26](https://github.com/lenneTech/deploy.party/compare/v1.0.25...v1.0.26) (2024-12-20)


### Bug Fixes

* fix errors in install.sh ([a2f7b95](https://github.com/lenneTech/deploy.party/commit/a2f7b95625c4284c7edd6684143b8a4d1a220973))

## [1.0.25](https://github.com/lenneTech/deploy.party/compare/v1.0.24...v1.0.25) (2024-12-20)


### Bug Fixes

* fix errors in install.sh ([e87744d](https://github.com/lenneTech/deploy.party/commit/e87744df979704d5810ef6f65ac3faf9afb64f76))

## [1.0.24](https://github.com/lenneTech/deploy.party/compare/v1.0.23...v1.0.24) (2024-12-20)


### Bug Fixes

* fix errors in install.sh ([f5a1f29](https://github.com/lenneTech/deploy.party/commit/f5a1f294b758c418eb10bb173530aea8d5a4f874))

## [1.0.23](https://github.com/lenneTech/deploy.party/compare/v1.0.22...v1.0.23) (2024-12-20)


### Bug Fixes

* fix errors in install.sh ([8e5fa15](https://github.com/lenneTech/deploy.party/commit/8e5fa15993835a387173ef1694c9fbfbf4777b61))

## [1.0.22](https://github.com/lenneTech/deploy.party/compare/v1.0.21...v1.0.22) (2024-12-20)


### Bug Fixes

* fix errors in install.sh ([1bb4e8c](https://github.com/lenneTech/deploy.party/commit/1bb4e8c3b171fe0dc11ffecc9bca1e8f77bc396e))

## [1.0.21](https://github.com/lenneTech/deploy.party/compare/v1.0.20...v1.0.21) (2024-12-19)


### Bug Fixes

* fix local handling ([4759228](https://github.com/lenneTech/deploy.party/commit/4759228755e8d38717b2e0023b0ae5be79e347d5))

## [1.0.20](https://github.com/lenneTech/deploy.party/compare/v1.0.19...v1.0.20) (2024-12-19)


### Bug Fixes

* fix local handling ([4f2d2db](https://github.com/lenneTech/deploy.party/commit/4f2d2db768ed7d746f34ccf03c927db9ebcf803b))

## [1.0.19](https://github.com/lenneTech/deploy.party/compare/v1.0.18...v1.0.19) (2024-12-19)


### Bug Fixes

* fix wrong traefik config ([d60b50c](https://github.com/lenneTech/deploy.party/commit/d60b50cef7780ad053740bdda710a644702ccc55))

## [1.0.18](https://github.com/lenneTech/deploy.party/compare/v1.0.17...v1.0.18) (2024-12-19)


### Bug Fixes

* fix wrong images names ([6ec92a5](https://github.com/lenneTech/deploy.party/commit/6ec92a5b5a625a660f7eb58f839dc016118e0208))

## [1.0.17](https://github.com/lenneTech/deploy.party/compare/v1.0.16...v1.0.17) (2024-12-19)


### Bug Fixes

* fix wrong images names ([d5a8b4f](https://github.com/lenneTech/deploy.party/commit/d5a8b4f2519b4753bfa04443bf9b5595af1be957))

## [1.0.16](https://github.com/lenneTech/deploy.party/compare/v1.0.15...v1.0.16) (2024-12-19)


### Bug Fixes

* fix wrong images names ([1613f68](https://github.com/lenneTech/deploy.party/commit/1613f6820709c848335d901967e10ad117570d14))

## [1.0.15](https://github.com/lenneTech/deploy.party/compare/v1.0.14...v1.0.15) (2024-12-19)


### Bug Fixes

* fix errors in install.sh ([1085ab7](https://github.com/lenneTech/deploy.party/commit/1085ab7b9ce8641592ffa067d6aa266bf3f60fe8))

## [1.0.14](https://github.com/lenneTech/deploy.party/compare/v1.0.13...v1.0.14) (2024-12-19)


### Bug Fixes

* fix errors in install.sh ([7b00605](https://github.com/lenneTech/deploy.party/commit/7b006057a6dc97e4051bc60054b42c2923887848))

## [1.0.13](https://github.com/lenneTech/deploy.party/compare/v1.0.12...v1.0.13) (2024-12-19)


### Bug Fixes

* fix github ci ([e05da24](https://github.com/lenneTech/deploy.party/commit/e05da247bf82cf8ab83a44474f6390004b1e642f))

## [1.0.12](https://github.com/lenneTech/deploy.party/compare/v1.0.11...v1.0.12) (2024-12-19)


### Bug Fixes

* fix github ci ([417ae85](https://github.com/lenneTech/deploy.party/commit/417ae8589db4e9c65330ca6461c305db0d145259))

## [1.0.11](https://github.com/lenneTech/deploy.party/compare/v1.0.10...v1.0.11) (2024-12-19)


### Bug Fixes

* fix github ci ([ca023ea](https://github.com/lenneTech/deploy.party/commit/ca023eaceb60f0d60907e05e85cdda936d58f1f1))
* fix github ci ([80ca599](https://github.com/lenneTech/deploy.party/commit/80ca5998d3ead444df8e75e3d2cebfeb6dd2074b))

## [1.0.10](https://github.com/lenneTech/deploy.party/compare/v1.0.9...v1.0.10) (2024-12-19)


### Bug Fixes

* fix github ci ([0418fc2](https://github.com/lenneTech/deploy.party/commit/0418fc25aaa5f616d3d9e2cebbe5a753da997d25))

## [1.0.9](https://github.com/lenneTech/deploy.party/compare/v1.0.8...v1.0.9) (2024-12-19)


### Bug Fixes

* fix github ci ([78422c7](https://github.com/lenneTech/deploy.party/commit/78422c76d32dcb942289c69ceda0347bfd3033d3))
* fix github ci ([d9f39e2](https://github.com/lenneTech/deploy.party/commit/d9f39e283a43f85c0dfc66992d845cee41c3ab2c))
* fix github ci ([cf9e45d](https://github.com/lenneTech/deploy.party/commit/cf9e45d6f26769fc21091bec913e3caec7f30acc))

## [1.0.8](https://github.com/lenneTech/deploy.party/compare/v1.0.7...v1.0.8) (2024-12-19)


### Bug Fixes

* fix github ci ([262587b](https://github.com/lenneTech/deploy.party/commit/262587ba2e7c0a37224550d08b300d03686b854e))

## [1.0.7](https://github.com/lenneTech/deploy.party/compare/v1.0.6...v1.0.7) (2024-12-19)


### Bug Fixes

* fix github ci ([33e879b](https://github.com/lenneTech/deploy.party/commit/33e879b5a5d06edf8f38880d1b0e9747a3081efe))

## [1.0.6](https://github.com/lenneTech/deploy.party/compare/v1.0.5...v1.0.6) (2024-12-19)


### Bug Fixes

* fix github ci ([9cd7155](https://github.com/lenneTech/deploy.party/commit/9cd7155bcda0f5025cb65e7c68fffce677112223))

## [1.0.5](https://github.com/lenneTech/deploy.party/compare/v1.0.4...v1.0.5) (2024-12-19)


### Bug Fixes

* fix github ci ([39974f1](https://github.com/lenneTech/deploy.party/commit/39974f1ce30143073da399a30bffa7f5c432f3c1))

## [1.0.4](https://github.com/lenneTech/deploy.party/compare/v1.0.3...v1.0.4) (2024-12-19)


### Bug Fixes

* fix github ci ([1822967](https://github.com/lenneTech/deploy.party/commit/182296736a4ddd0e9adf6a68c00ca388d8bba192))
* fix github ci ([8da2d18](https://github.com/lenneTech/deploy.party/commit/8da2d186694126d3588ac183dd0516c8a103aef2))

## [1.0.3](https://github.com/lenneTech/deploy.party/compare/v1.0.2...v1.0.3) (2024-12-19)


### Bug Fixes

* fix github ci ([ae94eae](https://github.com/lenneTech/deploy.party/commit/ae94eae1cba0ea8244ceb218b3b4d082fdf5c669))

## [1.0.2](https://github.com/lenneTech/deploy.party/compare/v1.0.1...v1.0.2) (2024-12-19)


### Bug Fixes

* debug github ci ([b5ca836](https://github.com/lenneTech/deploy.party/commit/b5ca8365209f24bb1761b8e094705e9e8ffd057d))

## [1.0.1](https://github.com/lenneTech/deploy.party/compare/v1.0.0...v1.0.1) (2024-12-19)


### Bug Fixes

* debug github ci ([2eea685](https://github.com/lenneTech/deploy.party/commit/2eea68555f5b0385c35d51bab3a8c5ec882a2f00))

# 1.0.0 (2024-12-19)


### Bug Fixes

* fix github ci ([10e30d6](https://github.com/lenneTech/deploy.party/commit/10e30d63be810e5ea11b6f7fe66d56a793fb923e))
