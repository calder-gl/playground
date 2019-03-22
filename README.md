# Calder Playground

## Development Setup

1. Install the node packages with Yarn:

```bash
yarn install
```

```bash
# Needed to get the correct version of `calder-gl`.
yarn upgrade calder-gl
```

2. Compile the TypeScript:

```bash
yarn compile
```

3. Start the server:

```bash
yarn server
```

4. Open `localhost:3000`

```bash
open http://localhost:3000
```

## Updating Calder
To use a newer version of Calder in this repo, run the following:

```bash
yarn upgrade calder-gl
```

This will change the commit for `calder#master` in `yarn.lock`, which you can then commit.
