declare module 'bncode' {
  interface BencodeStatic {
    encode(data: any): Buffer;
    decode(data: Buffer): any;
  }

  const bencode: BencodeStatic;
  export = bencode;
}