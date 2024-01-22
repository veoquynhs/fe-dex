import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { useMoralis, useWeb3Contract } from "react-moralis"
import dexAbi from "../constants/DEX.json"
import tokenAbi from "../constants/Token.json"
import networkMapping from "../constants/networkMapping.json"
import { useEffect, useState } from "react"
import { ethers } from "ethers"

export default function Home() {
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const dexAddress = chainId ? networkMapping[chainString].DEX[0] : null
    const token0Address = chainId ? networkMapping[chainString].Token0[0] : null
    const token1Address = chainId ? networkMapping[chainString].Token1[0] : null
    const dispatch = useNotification()

    const [reserve0, setReserve0] = useState("0")
    const [reserve1, setReserve1] = useState("0")

    const [tkIn, setTkIn] = useState("0")
    const [amtIn, setAmtIn] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function approveAndSwap(data) {
        console.log("Approving token in...")
        const tokenIn = data.data[0].inputResult
        const amountIn = data.data[1].inputResult

        setTkIn(tokenIn)
        setAmtIn(amountIn.toString())

        const approveTokenOptions = {
            abi: tokenAbi,
            contractAddress: tokenIn,
            functionName: "approve",
            params: {
                to: dexAddress,
                amount: ethers.utils.parseUnits(amountIn),
            },
        }

        await runContractFunction({
            params: approveTokenOptions,
            onSuccess: (tx) => handleApproveSuccess(tx, tokenIn, amountIn),
            onError: (error) => {
                dispatch({
                    type: "error",
                    title: "❌ Oops!",
                    message: "Error approving token: " + error.message,
                    position: "topR",
                })
            },
        })
    }

    async function handleApproveSuccess(tx, tokenIn, amountIn) {
        console.log("Swapping...")

        // Wait for 10 seconds before calling runContractFunction
        await new Promise((resolve) => setTimeout(resolve, 10000))

        const swapOptions = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "swap",
            params: {
                _tokenIn: tokenIn,
                _amountIn: amountIn,
            },
        }

        await runContractFunction({
            params: swapOptions,
            onSuccess: (tx) => handleSwapSuccess(tx),
            onError: (error) => {
                dispatch({
                    type: "error",
                    title: "❌ Oops!",
                    message: "Error swapping: " + error.message,
                    position: "topR",
                })
            },
        })
    }

    async function handleSwapSuccess(tx) {
        await tx.wait(1)

        dispatch({
            type: "success",
            title: "✅ Swapped successfully!",
            message: "Tx Hash: " + tx.hash,
            position: "topR",
        })
        console.log(tx)
    }

    async function setupUI() {
        // Get Reserve 0
        const returnedReserve0 = await runContractFunction({
            params: {
                abi: dexAbi,
                contractAddress: dexAddress,
                functionName: "reserve0",
            },
            onError: (error) => console.log(error),
        })
        if (returnedReserve0) {
            setReserve0(returnedReserve0.toString())
        }

        // Get Reserve 1
        const returnedReserve1 = await runContractFunction({
            params: {
                abi: dexAbi,
                contractAddress: dexAddress,
                functionName: "reserve1",
            },
            onError: (error) => console.log(error),
        })
        if (returnedReserve1) {
            setReserve1(returnedReserve1.toString())
        }
    }

    useEffect(() => {
        setupUI()
    }, [reserve0, reserve1, tkIn, amtIn, account, isWeb3Enabled, chainId])

    return (
        <div className={`container mx-auto ${styles.main}`}>
            <div className={`flex flex-wrap ${styles.grid}`}>
                {isWeb3Enabled && chainId ? (
                    <div className={styles.card}>
                        <Form
                            onSubmit={approveAndSwap}
                            data={[
                                {
                                    name: "Token In",
                                    type: "text",
                                    value: "",
                                    label: "Enter the token address you want to swap",
                                    key: "tokenIn",
                                },
                                {
                                    name: "Token Amount",
                                    type: "number",
                                    label: "Enter the amount",
                                    value: "",
                                    key: "amountIn",
                                },
                            ]}
                            title="Let's Swap!"
                            id="Main Form"
                        />

                        <div className={styles.tokenInfo}>
                            <div>
                                Token 0 Address: <span className="font-bold">{token0Address}</span>
                            </div>
                            <div>
                                Token 1 Address: <span className="font-bold">{token1Address}</span>
                            </div>
                            <div>
                                Current amount in the pool is{" "}
                                <span className="font-bold">{reserve0}</span> TK0 and{" "}
                                <span className="font-bold">{reserve1}</span> TK1
                            </div>
                        </div>
                        {tkIn == token0Address ? (
                            <div className={styles.swapResult}>
                                <p>
                                    You will receive{" "}
                                    <strong>
                                        {Math.floor(
                                            (reserve1 * ((amtIn * 997) / 1000)) /
                                                (Number(reserve0) + Number(amtIn * 997) / 1000)
                                        )}
                                    </strong>{" "}
                                    TK1 (3% transaction fee charged)
                                </p>
                            </div>
                        ) : (
                            <div className={styles.swapResult}>
                                <p>
                                    You will receive{" "}
                                    <strong>
                                        {Math.floor(
                                            (reserve0 * ((amtIn * 997) / 1000)) /
                                                (Number(reserve1) + Number(amtIn * 997) / 1000)
                                        )}
                                    </strong>{" "}
                                    TK0 (3% transaction fee charged)
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.card}>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
