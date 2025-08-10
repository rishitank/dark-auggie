import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class AugmentApi implements ICredentialType {
  name = 'augmentApi';
  displayName = 'Augment Code API';
  documentationUrl = 'https://docs.augmentcode.com/cli/reference';
  properties: INodeProperties[] = [
    {
      displayName: 'Session Auth JSON',
      name: 'augmentSessionAuth',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Authentication JSON for AUGMENT_SESSION_AUTH',
      required: true
    },
    {
      displayName: 'API URL',
      name: 'augmentApiUrl',
      type: 'string',
      default: '',
      description: 'Optional AUGMENT_API_URL override'
    },
    {
      displayName: 'API Token',
      name: 'augmentApiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Optional AUGMENT_API_TOKEN to use instead of session auth'
    },
    {
      displayName: 'GitHub Token',
      name: 'githubApiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Optional GITHUB_API_TOKEN for GitHub-integrated actions'
    }
  ];
}
