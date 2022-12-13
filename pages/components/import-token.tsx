import {useEffect, useState} from "react";

import {isAddress} from "web3-utils";
import {isZeroAddress} from "ethereumjs-util";
import Input from "./input";

interface ImportTokenProps {
  onImport: (address: string) => void;
}

export function ImportToken({onImport}: ImportTokenProps) {
  const [addressValue, setAddressValue] = useState<string>('');

  function onChange(address: string) {
    setAddressValue(!isAddress(address) || isZeroAddress(address) ? '' : address);
  }

  return<>
    <Input onChange={onChange} placeHolder="Token address" />
    <button onClick={() => onImport(addressValue)} disabled={!addressValue}>import</button>
  </>
}