# Dark Auggie (n8n community node)

Dark Auggie is an n8n community node that wraps the Augment Code Auggie CLI to power agentic coding workflows in your automations.

## Install

- Ensure Node v24.5.0+ (.nvmrc provided)
- Build the package and load it into n8n per the community node guide

## Credentials

Create credentials named "Augment Code API" with a Session Auth JSON (AUGMENT_SESSION_AUTH). Optional: API URL override and API token.

## Usage

Use the node "Dark Auggie" to run auggie operations. Provide command and args, map inputs to stdin when needed, and capture stdout/stderr for downstream nodes.

