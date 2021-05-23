export type EncryptType = 'rsa' | 'dsa';

export interface IKeyPair
{
    publicKey: string,
    privateKey: string
}

export type Privacy = 'public' | 'private';