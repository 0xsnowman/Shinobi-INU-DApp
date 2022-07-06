import React, { useState, useEffect } from "react";
import { useWeb3React, UnsupportedChainIdError } from "@web3-react/core";
import {
  InjectedConnector,
  NoEthereumProviderError
} from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { formatEther, parseEther } from "@ethersproject/units";
import { Contract } from "@ethersproject/contracts";
import { ToastContainer, toast } from "react-toastify";

// components
import Modal from "../components/modal";

// abis
import TMXABI from "../abis/tmx.json";
import SNUABI from "../abis/snu.json";
import TMXPresaleABI from "../abis/tmxpresale.json";

// images
import LogoImage from "../assets/images/logo.svg";
import MetamaskImage from "../assets/images/metamask.svg";
import WalletConnectImage from "../assets/images/walletconnect.svg";

// variables
const SNUAddress = "0xd1cbfc7f417e9f5511a7502c83f2074f675995f5";
const TMXAddress = "0xd1cbfc7f417e9f5511a7502c83f2074f675995f5";
const TMXPresaleAddress = "0xFC902c04D8fCf67735432ADA207aD8061a8E63a6";
const ETHAmount = 0.2;
const transactionSuccessText = "Transaction Success";
const transactionFailText = "Transaction Fail";
const transactionRejectText = "Transaction Reject";

const Home = () => {
  const context = useWeb3React();
  const {
    library,
    chainId,
    account,
    activate,
    deactivate,
    active,
    error
    // connector
  } = context;
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [ETHBalance, setETHBalance] = useState();
  const [TMXBalance, setTMXBalance] = useState();
  const [tier, setTier] = useState(0);
  const [isDepositer, setIsDepositer] = useState(false);
  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(0);
  const [timeLeft, setTimeLeft] = React.useState("");
  // const [timeRelease, setTimeRelease] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [transactionPending, setTransactionPending] = useState(false);

  const openWalletModalHandler = () => setIsWalletModalOpen(true);
  const closeWalletModalHandler = () => setIsWalletModalOpen(false);

  const connectMetamask = () => {
    const injectedConnector = new InjectedConnector({
      supportedChainIds: [1]
    });
    activate(injectedConnector);
  };

  const connectWalletConnect = () => {
    const RPC_URLS = {
      1: "https://mainnet.infura.io/v3/407161c0da4c4f1b81f3cc87ca8310a7",
      // 4: "https://rinkeby.infura.io/v3/407161c0da4c4f1b81f3cc87ca8310a7"
    };
    const walletConnectConnector = new WalletConnectConnector({
      rpc: RPC_URLS,
      bridge: "https://bridge.walletconnect.org",
      qrcode: true
    });
    activate(walletConnectConnector);
  };

  const getAddressMessage = () => {
    if (account) {
      let prefix = "";
      if (tier > 0) {
        prefix = "YOU ARE IN WHITELIST";
      } else {
        prefix = "";
      }
      return prefix + " " + account.slice(0, 4) + "..." + account.slice(-4);
    } else {
      return "---";
    }
  };

  const getDepositAmountLimitMessage = () => {
    if (tier === 3) {
      return "0.6 ETH = 600000 TMX";
    }
    if (tier === 2) {
      return "0.4 ETH = 400000 TMX";
    }
    if (tier === 1) {
      return "0.2 ETH = 200000 TMX";
    }
    return "0.2 ETH = 200000 TMX";
  };

  const getNetworkMessage = () => {
    if (active) {
      return "CONNECTED TO ETH MAINNET";
    }
    if (error instanceof UnsupportedChainIdError) {
      return "CONNECTED WRONG NETWORK";
    }
    if (error instanceof NoEthereumProviderError) {
      return "NO ETHEREUM PROVIDER";
    }
    return "DISCONNCTED";
  };

  const contribute = async () => {
    if (getContributeButtonEnable()) {
      const presaleContract = new Contract(
        TMXPresaleAddress,
        TMXPresaleABI,
        library.getSigner()
      );
      try {
        let ETHAmountForDeposit = 0;
        if (tier === 3) {
          ETHAmountForDeposit = 0.6;
        }
        if (tier === 2) {
          ETHAmountForDeposit = 0.4;
        }
        if (tier === 1) {
          ETHAmountForDeposit = 0.2;
        }
        const transaction = await presaleContract.deposit({
          value: parseEther(ETHAmountForDeposit.toString())
        });
        const receipt = await transaction.wait();
        setTransactionPending(false);
        if (receipt.status) {
          toast.success(transactionSuccessText);
        } else {
          toast.error(transactionFailText);
        }

        // reloading eth balance after deposit
        library
          .getBalance(account)
          .then((balance: any) => {
            setETHBalance(balance);
          })
          .catch((err: any) => {
            setETHBalance(undefined);
          });

        // reloading isDeposit state after deposit
        const userInfo = await presaleContract.userInfo(account);
        if (parseFloat(formatEther(userInfo.deposit)) > 0) {
          setIsDepositer(true);
        }

        // reloading total deposit after deposit
        const _depositAmount = await presaleContract._TOTAL_DEPOSIT();
        setDepositAmount(
          parseFloat(formatEther(_depositAmount)).toPrecision(2)
        );
      } catch (ex) {
        console.log("depositError", ex);
        setTransactionPending(false);
        toast.warn(transactionRejectText);
      }
    }
  };

  // const claim = async () => {
  //   if (getClaimButtonEnabled()) {
  //     const presaleContract = new Contract(
  //       TMXPresaleAddress,
  //       TMXPresaleABI,
  //       library.getSigner()
  //     );
  //     try {
  //       const transaction = await presaleContract.withdraw();
  //       const receipt = await transaction.wait();
  //       setTransactionPending(false);
  //       if (receipt.status) {
  //         toast.success(transactionSuccessText);
  //       } else {
  //         toast.error(transactionFailText);
  //       }
  //     } catch (ex) {
  //       console.log("claimError", ex);
  //       setTransactionPending(false);
  //       toast.warn(transactionRejectText);
  //     }
  //   }
  // };

  const getContributeButtonText = () => {
    if (!active) {
      return "CONNECT WALLET";
    }
    if (tier === 0) {
      return "YOU ARE NOT IN WHITELIST";
    }
    if (Date.now() / 1000 < timeStart) {
      return "PRESALE IS NOT STARTED";
    }
    if (Date.now() / 1000 > timeEnd) {
      return "PRESALE IS FINISHED";
    }
    if (isDepositer) {
      return "YOU CONTRIBUTED ALREADY";
    }
    if (ETHBalance) {
      if (parseFloat(formatEther(ETHBalance)) < ETHAmount * tier + 0.02) {
        return "INSUFFICIENT BALANCE";
      }
    }
    if (transactionPending) {
      return "PENDING";
    } else {
      return "CONTRIBUTE";
    }
  };

  const getContributeButtonEnable = () => {
    if (!active) {
      return false;
    }
    if (isDepositer) {
      return false;
    }
    if (Date.now() / 1000 < timeStart || Date.now() / 1000 > timeEnd) {
      return false;
    }
    if (ETHBalance) {
      if (parseFloat(formatEther(ETHBalance)) < 0.32) {
        return false;
      }
    }
    if (transactionPending) {
      return false;
    } else {
      return true;
    }
  };

  const calculateTimeLeft = () => {
    let difference = timeEnd * 1000 - +new Date();
    if (timeStart > +new Date()) {
      difference = timeEnd * 1000 - timeStart * 1000;
    } else {
      difference = timeEnd * 1000 - +new Date();
    }

    if (difference > 0 && active) {
      let days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${days} DAYS ${hours < 10 ? "0" + hours : hours} : ${
        minutes < 10 ? "0" + minutes : minutes
      } : ${seconds < 10 ? "0" + seconds : seconds}`;
    } else {
      return "0 DAYS 00:00:00";
    }
  };

  // const getClaimButtonEnabled = () => {
  //   if (!active) {
  //     return false;
  //   }
  //   if (Date.now() / 1000 < timeEnd || Date.now() / 1000 < timeRelease) {
  //     return false;
  //   }
  //   if (ETHBalance) {
  //     if (parseFloat(formatEther(ETHBalance)) < 0.02) {
  //       return false;
  //     }
  //   }
  //   if (transactionPending) {
  //     return false;
  //   } else {
  //     return true;
  //   }
  // };

  useEffect(() => {
    let timer: any;
    if (active) {
      const presaleContract = new Contract(
        TMXPresaleAddress,
        TMXPresaleABI,
        library.getSigner()
      );
      console.log("presaleContract", presaleContract);
      timer = setTimeout(async () => {
        const _depositAmount = await presaleContract._TOTAL_DEPOSIT();
        setDepositAmount(
          parseFloat(formatEther(_depositAmount)).toPrecision(2)
        );
      }, 5000);
    }

    return () => clearTimeout(timer);
  }, [active, library]);

  useEffect(() => {
    const getETHBalance = () => {
      library
        .getBalance(account)
        .then((balance: any) => {
          setETHBalance(balance);
        })
        .catch((err: any) => {
          setETHBalance(undefined);
        });
    };

    const getTMXBalance = async () => {
      const TMXContract = new Contract(TMXAddress, TMXABI, library.getSigner());
      const _TMXBalance = await TMXContract.balanceOf(account);
      setTMXBalance(_TMXBalance);
    };

    const getTier = async () => {
      const presaleContract = new Contract(
        TMXPresaleAddress,
        TMXPresaleABI,
        library.getSigner()
      );
      const tier_1 = await presaleContract.tiers(1);
      const tier_2 = await presaleContract.tiers(2);
      const tier_3 = await presaleContract.tiers(3);
      const SNUContract = new Contract(SNUAddress, SNUABI, library.getSigner());
      const _SNUBalance = await SNUContract.balanceOf(account);

      let _tier = 0;
      if (_SNUBalance >= tier_3.requiredWhitelistTokenAmount) {
        _tier = 3;
      } else if (_SNUBalance >= tier_2.requiredWhitelistTokenAmount) {
        _tier = 2;
      } else if (_SNUBalance >= tier_1.requiredWhitelistTokenAmount) {
        _tier = 1;
      } else {
        _tier = 0;
      }
      setTier(_tier);
    };

    const getIsDepositer = async () => {
      const presaleContract = new Contract(
        TMXPresaleAddress,
        TMXPresaleABI,
        library.getSigner()
      );
      const userInfo = await presaleContract.userInfo(account);
      console.log("userInfo", userInfo);
      if (parseFloat(formatEther(userInfo.deposit)) > 0) {
        setIsDepositer(true);
      }
    };

    const getTime = async () => {
      const presaleContract = new Contract(
        TMXPresaleAddress,
        TMXPresaleABI,
        library.getSigner()
      );
      const _timeStart = await presaleContract._TIME_START();
      console.log("_timeStart", _timeStart.toNumber());
      console.log("Date.now()", Date.now() / 1000);
      setTimeStart(_timeStart.toNumber());

      const _timeEnd = await presaleContract._TIME_END();
      console.log("_timeEnd", _timeEnd.toNumber());
      setTimeEnd(_timeEnd.toNumber());

      // const _timeRelease = await presaleContract._TIME_RELEASE();
      // console.log("_timeRelease", _timeRelease.toNumber());
      // setTimeRelease(_timeRelease.toNumber());
    };

    if (library && active && !error) {
      getETHBalance();
      getTMXBalance();
      getIsDepositer();
      getTime();
      getTier();
    } else {
      setETHBalance(undefined);
      setTMXBalance(undefined);
      setIsDepositer(false);
    }
  }, [active, chainId, error, library, account]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="page-component">
      <ToastContainer
        position="top-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Modal
        isOpen={isWalletModalOpen}
        closeModalHandler={closeWalletModalHandler}
      >
        <div
          className="component-modal__modal__item"
          onClick={() => {
            connectMetamask();
            closeWalletModalHandler();
          }}
        >
          <img
            className="component-modal__modal__item__img"
            src={MetamaskImage}
            alt="metamask"
          />
          <div className="component-modal__modal__item__text">Metamask</div>
        </div>
        <div
          className="component-modal__modal__item"
          onClick={() => {
            connectWalletConnect();
            closeWalletModalHandler();
          }}
        >
          <img
            className="component-modal__modal__item__img"
            src={WalletConnectImage}
            alt="walletconnect"
          />
          <div className="component-modal__modal__item__text">
            WalletConnect
          </div>
        </div>
      </Modal>
      <div className="page-component__header">
        <img
          className="page-component__header__logo"
          src={LogoImage}
          alt="logo"
        />
        <div
          className="page-component__header__connect-btn"
          onClick={() => {
            if (active) {
              deactivate();
            } else {
              openWalletModalHandler();
            }
          }}
        >
          {active ? "DISCONNECT" : "CONNECT"}
        </div>
      </div>
      <div className="page-component__body">
        <div className="container">
          <div className="page-component__body__presale-display">
            <div className="page-component__body__presale-display__header">
              TitaniumX
            </div>
            <div className="page-component__body__presale-display__body">
              <div className="page-component__body__presale-display__body__body">
                <div className="page-component__body__presale-display__body__body__1">
                  <div className="page-component__body__presale-display__body__body__1__1">
                    <div className="page-component__body__presale-display__body__body__1__1__title">
                      {depositAmount} ETH RAISED
                    </div>
                    <div className="page-component__body__presale-display__body__body__1__1__percent">
                      <div
                        className="page-component__body__presale-display__body__body__1__1__percent__value"
                        style={{
                          width: (parseFloat(depositAmount) / 60) * 100 + "%"
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="page-component__body__presale-display__body__body__1__2">
                    <div className="page-component__body__presale-display__body__body__1__2__input">
                      {/* <input
                        className="page-component__body__presale-display__body__body__1__2__input__input"
                        value={ETHAmount}
                        onChange={e => setETHAmount(e.target.value)}
                        pattern="^[0-9]*[.,]?[0-9]*$"
                        type="number"
                        inputMode="decimal"
                        placeholder="1 ETH = 150000000 SNU"
                        spellCheck={false}
                        autoComplete="off"
                      /> */}
                      {getDepositAmountLimitMessage()}
                    </div>
                    <div className="page-component__body__presale-display__body__body__1__2__title">
                      TIME LEFT = {timeLeft}
                    </div>
                  </div>
                  <div
                    className="page-component__body__presale-display__body__body__1__3"
                    style={{
                      opacity: getContributeButtonEnable() ? "1" : "0.3",
                      cursor: getContributeButtonEnable()
                        ? "pointer"
                        : "not-allowed"
                    }}
                    onClick={e => {
                      e.preventDefault();
                      contribute();
                    }}
                  >
                    {getContributeButtonText()}
                  </div>
                  {/* <div
                    className="page-component__body__presale-display__body__body__1__4"
                    style={{
                      opacity: getClaimButtonEnabled() ? "1" : "0.3",
                      cursor: getClaimButtonEnabled()
                        ? "pointer"
                        : "not-allowed"
                    }}
                    onClick={e => {
                      e.preventDefault();
                      claim();
                    }}
                  >
                    Claim
                  </div> */}
                </div>
                <div className="page-component__body__presale-display__body__body__2">
                  <div className="page-component__body__presale-display__body__body__2__left">
                    <div className="page-component__body__presale-display__body__body__2__left__top">
                      BALANCE
                    </div>
                    <div className="page-component__body__presale-display__body__body__2__left__bottom">
                      {ETHBalance === undefined
                        ? "--"
                        : parseFloat(formatEther(ETHBalance)).toPrecision(4)}
                      {` ETH`}
                    </div>
                  </div>
                  <div className="page-component__body__presale-display__body__body__2__right">
                    <div className="page-component__body__presale-display__body__body__2__left__top">
                      TOKEN BALANCE
                    </div>
                    <div className="page-component__body__presale-display__body__body__2__left__bottom">
                      {TMXBalance === undefined
                        ? "--"
                        : parseFloat(formatEther(TMXBalance)).toPrecision(4)}
                      {` TMX`}
                    </div>
                  </div>
                </div>
                {/* <div className="page-component__body__presale-display__body__body__3">
                  <div className="page-component__body__presale-display__body__body__3__1">
                    TOKEN WILL BE RELEASED ON
                    <br />
                    16/2/2022 - 15:53
                  </div>
                  <div className="page-component__body__presale-display__body__body__3__2">
                    CLAIM
                  </div>
                  <div className="page-component__body__presale-display__body__body__3__3">
                    MAXIMUM CONTRIBUTION 0.1 ETH
                    <br />
                    MINIMUM CONTRIBUTION 3.0 ETH
                  </div>
                </div> */}
              </div>
              <div className="page-component__body__presale-display__body__footer">
                {getAddressMessage()}
              </div>
            </div>
            <div className="page-component__body__presale-display__footer">
              {getNetworkMessage()}
            </div>
          </div>
          <div className="page-component__body__connect-btn"></div>
        </div>
      </div>
    </div>
  );
};

export default Home;
