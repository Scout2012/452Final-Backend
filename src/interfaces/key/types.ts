export type EncryptType = 'rsa' | 'dsa' | 'x448';

export interface IKeyPair
{
    publicKey: string,
    privateKey: string
}

export type Privacy = 'public' | 'private';