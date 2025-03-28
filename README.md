# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.



## AWS Setup

To install the adapter, open a terminal window and run the following command. This example uses the community adapter available at github.com/gzimbron/amplify-adapter. If you are using a different community adapter, replace amplify-adapter with the name of your adapter.

npm install amplify-adapter
In the project folder for your SvelteKit app, open the svelte.config.js file. Edit the file to use the amplify-adapter or replace 'amplify-adapter' with the name of your adapter. The file should look like the following.

import adapter from 'amplify-adapter';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

              
/** @type {import('@sveltejs/kit').Config} */
const config = {
        // Consult https://kit.svelte.dev/docs/integrations#preprocessors
        // for more information about preprocessors
        preprocess: vitePreprocess(),

        kit: {
                // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
                // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
                // See https://kit.svelte.dev/docs/adapters for more information about adapters.
                adapter: adapter()
        }
};

export default config;
Commit the change and push the application to your Git repository.
Now you are ready to deploy your SvelteKit app to Amplify.
Sign in to the AWS Management Console and open the Amplify console.
On the All apps page, choose Create new app.
On the Start building with Amplify page, choose your Git repository provider, then choose Next.
On the Add repository branch page, do the following:
Select the name of the repository to connect.
Select the name of the repository branch to connect.
Choose Next.
On the App settings page, locate the Build settings section. For Build output directory enter build.
You must also update the app's frontend build commands in the build specification. To open the build specification, choose Edit YML file.
In the amplify.yml file, locate the frontend build commands section. Enter - cd build/compute/default/ and - npm i --production.
Your build settings file should look like the following.

version: 1
frontend:
    phases:
        preBuild:
            commands:
                - 'npm ci --cache .npm --prefer-offline'
        build:
            commands:
                - 'npm run build'
                - 'cd build/compute/default/'
                - 'npm i --production'
              
    artifacts:
        baseDirectory: build
        files:
            - '**/*'
    cache:
        paths:
            - '.npm/**/*'
            
Choose Save.
If you want Amplify to be able to deliver app logs to Amazon CloudWatch Logs, you must explicitly enable this in the console. Open the Advanced settings section, then choose Enable SSR app logs in the Server-Side Rendering (SSR) deployment section.
Choose Next.
On the Review page, choose Save and deploy.
