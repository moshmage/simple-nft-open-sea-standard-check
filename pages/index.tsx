import Head from 'next/head'

import styles from '../styles/Home.module.css'
import {Erc721Standard, Web3Connection} from "@taikai/dappkit";
import {useEffect, useState} from "react";
import {ImportToken} from "./components/import-token";

interface Token {name: string, symbol: string, balance: number, error: boolean|null, address: string}
type TokenList = Token[];

export default function Home() {

  const [web3Host, setWeb3Host] = useState('https://eth-diogenes.taikai.network:8080');
  const [privateKey, setPrivateKey] = useState('');
  const [web3Connection, setWeb3Connection] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');

  const [list, setList] = useState<TokenList>([]);

  async function connect() {
    try {
    const _web3Connection = new Web3Connection({ web3Host, privateKey });
    _web3Connection.start();
    if (!_web3Connection.options.privateKey) await _web3Connection.connect();
    setWalletAddress(await _web3Connection.getAddress());


      setWeb3Connection(_web3Connection);
    } catch (e) {
      console.error(`e`, e)
    }

  }

  async function checkNftList(forList?: TokenList) {
    const _list = Array.from(forList || list);

    async function mapToken(token: Token): Promise<Token> {

      console.log(`token`, token);

      if (!token.balance)
        return {...token};

      const _nft = new Erc721Standard(web3Connection, token.address);
      _nft.loadContract();

      const uris = await Promise.all(
        Array(token.balance)
          .map((v,i) => i+1)
          .map(i => _nft.callTx(_nft.contract.methods.tokenURI(i)))).catch(_ => []);

      if (!uris.length)
        return {...token, error: true}

      const invalidURI =
        uris.some(v => {
          if (!v)
            return true;

          try {
            new URL(v);
          } catch (e) {
            return true;
          }

          return false;
        });

      if (invalidURI)
        return {...token, error: true};

      const jsonDataForTokens = await Promise.all(uris.map(uri => fetch(uri).then(d => d.json()).catch(_ => null)));
      if (jsonDataForTokens === null)
        return {...token, error: true};

      if (jsonDataForTokens.some(data => ['image', 'name',].some(v => !data?.[v])))
        return {...token, error: true};

      return {
        ...token,
        error: false
      }
    }

    const __list = await Promise.all(_list.map(mapToken))

    console.log(__list)

    setList(__list);
  }

  async function loadToken(address: string) {
    if (!web3Connection)
      return;

    const _nft = new Erc721Standard(web3Connection, address);
    _nft.loadContract();
    const name = await _nft.callTx(_nft.contract.methods.name());
    const symbol = await _nft.callTx(_nft.contract.methods.symbol());
    const balance = await _nft.callTx(_nft.contract.methods.balanceOf(walletAddress));

    setList([...list, {name, balance, symbol, address, error: null}]);

    await checkNftList([...list, {name, balance, symbol, address, error: null}]);
  }

  // useEffect(() => { checkNftList() }, [list]);
  //0x5D1cE1F75bC46c871Eb59A72252dA5bD2e40078E name symbol
  //0x4Cf33D9Fe02De4050B62762AC1ccBEEC1Be25AF3 new name symbol
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>



      <main className={styles.main}>
        <h1 className={styles.title}>Connect your wallet</h1>

        <div>
          <input placeholder="Web3 RPC" onChange={(e) => setWeb3Host(e.target.value)}/>
          <input placeholder="Private Key" />
          <button onClick={() => connect()}>connect</button>
        </div>

        {(web3Connection && walletAddress && <>
            <div className={styles.grid}>
              <ImportToken onImport={(a) => loadToken(a)} />
            </div>

            {list.map(token => <li key={token.address}>{token.name} {token.symbol} {token.balance}  error? {token.error === null ? 'n/a' : token.error ? 'yes' : 'no'}</li>)}
          </>
          ) || ''}

      </main>


    </div>
  )
}
