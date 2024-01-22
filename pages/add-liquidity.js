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
    const [reserve1, setReserve1] = useState("1")
    const [shares, setShares] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function approveAndAddLiquidity(data) {
        console.log("Approving token 0...")
        const amount0 = data.data[0].inputResult
        const amount1 = data.data[1].inputResult

        const approveToken0Options = {
            abi: tokenAbi,
            contractAddress: token0Address,
            functionName: "approve",
            params: {
                to: dexAddress,
                amount: ethers.utils.parseUnits(amount0),
            },
        }

        await runContractFunction({
            params: approveToken0Options,
            onSuccess: (tx) => handleToken0ApproveSuccess(tx, amount0, amount1),
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

    async function handleToken0ApproveSuccess(tx, amount0, amount1) {
        console.log("Approving token 1...")

        const approveToken1Options = {
            abi: tokenAbi,
            contractAddress: token1Address,
            functionName: "approve",
            params: {
                to: dexAddress,
                amount: ethers.utils.parseUnits(amount1),
            },
        }

        await runContractFunction({
            params: approveToken1Options,
            onSuccess: (tx) => handleApproveSuccess(tx, amount0, amount1),
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

    async function handleApproveSuccess(tx, amount0, amount1) {
        console.log("Adding liquidity...")

        // Wait for 10 seconds before calling runContractFunction
        await new Promise((resolve) => setTimeout(resolve, 10000))

        const addLiquidityOptions = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "addLiquidity",
            params: {
                _amount0: amount0,
                _amount1: amount1,
            },
        }

        await runContractFunction({
            params: addLiquidityOptions,
            onSuccess: (tx) => handleAddLiquiditySuccess(tx),
            onError: (error) => {
                dispatch({
                    type: "error",
                    title: "❌ Oops!",
                    message: "Error adding liquidity: " + error.message,
                    position: "topR",
                })
            },
        })
    }

    async function handleAddLiquiditySuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            title: "✅ Added liquidity successfully!",
            message: "Tx Hash: " + tx.hash,
            position: "topR",
        })
        console.log(tx)
    }

    async function setupUI() {
        // Get Shares
        const returnedShares = await runContractFunction({
            params: {
                abi: dexAbi,
                contractAddress: dexAddress,
                functionName: "sharesOf",
                params: { "": account },
            },
            onError: (error) => console.log(error),
        })
        if (returnedShares) {
            setShares(returnedShares.toString())
        }

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
    }, [reserve0, reserve1, shares, account, isWeb3Enabled, chainId])

    return (
        <div className={`container mx-auto ${styles.main}`}>
            <div className={`flex flex-wrap ${styles.grid}`}>
                {isWeb3Enabled && chainId ? (
                    <div className={styles.card}>
                        <Form
                            onSubmit={approveAndAddLiquidity}
                            data={[
                                {
                                    name: "Token 0 Amount",
                                    type: "number",
                                    value: "",
                                    label: "Enter the amount of Token 0",
                                    key: "amount0",
                                },
                                {
                                    name: "Token 1 Amount",
                                    type: "number",
                                    label: "Enter the amount of Token 1",
                                    value: "",
                                    key: "amount1",
                                },
                            ]}
                            title="Become a Liquidity Provider!"
                            id="Main Form"
                            titleClassName={styles.formTitle}
                        />
                        <div className={styles.shareInfo}>
                            Your current shares is <span className="font-bold">{shares}</span>
                        </div>
                        {reserve0 != "0" && reserve1 != "0" ? (
                            <div className={styles.ratioInfo}>
                                The amount of tokens added to the liquidity pool must comply with
                                the existing ratio in the pool, which is currently{" "}
                                <span className="font-bold">{reserve0 / reserve1}</span> for
                                Token0/Token1
                            </div>
                        ) : (
                            <div className={styles.firstLiquidityProvider}>
                                You're the first one to provide liquidity!
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
