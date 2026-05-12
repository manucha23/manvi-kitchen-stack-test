import { env } from '../config/env';

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

interface CognitoInitiateAuthResponse {
  AuthenticationResult?: {
    IdToken?: string;
    AccessToken?: string;
    RefreshToken?: string;
  };
  message?: string;
  __type?: string;
}

function requireCognitoValue(name: 'cognitoRegion' | 'cognitoClientId' | 'testUsername' | 'testPassword'): string {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing Cognito setting for ${name}. Set the corresponding environment variable before authenticated smoke tests.`);
  }
  return value;
}

export class CognitoClient {
  async login(username = requireCognitoValue('testUsername'), password = requireCognitoValue('testPassword')): Promise<AuthTokens> {
    const region = requireCognitoValue('cognitoRegion');
    const clientId = requireCognitoValue('cognitoClientId');

    const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    });

    const body = (await response.json()) as CognitoInitiateAuthResponse;
    if (!response.ok) {
      throw new Error(`Cognito login failed: ${body.__type ?? response.status} ${body.message ?? response.statusText}`);
    }

    const authenticationResult = body.AuthenticationResult;
    if (!authenticationResult?.IdToken || !authenticationResult.AccessToken) {
      throw new Error('Cognito login did not return the expected tokens.');
    }

    return {
      idToken: authenticationResult.IdToken,
      accessToken: authenticationResult.AccessToken,
      refreshToken: authenticationResult.RefreshToken,
    };
  }
}
