import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import dexAbi from "../constants/DEX.json"
import tokenAbi from "../constants/Token.json"
import networkMapping from "../constants/networkMapping.json"
import { useEffect, useState } from "react"

export default function Home() {
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const dexAddress = chainId ? networkMapping[chainString].DEX[0] : null
    const token0Address = chainId ? networkMapping[chainString].Token0[0] : null
    const token1Address = chainId ? networkMapping[chainString].Token1[0] : null
    const dispatch = useNotification()
    const [shares, setShares] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function approveAndAddLiquidity(data) {
        console.log("Approving token 0 & token 1...")
        const amount0 = data.data[0].inputResult
        const amount1 = data.data[1].inputResult

        const approveToken0Options = {
            abi: tokenAbi,
            contractAddress: token0Address,
            functionName: "approve",
            params: {
                to: dexAddress,
                amount: amount0 * 10 ** 18,
            },
        }

        const approveToken1Options = {
            abi: tokenAbi,
            contractAddress: token1Address,
            functionName: "approve",
            params: {
                to: dexAddress,
                amount: amount1 * 10 ** 18,
            },
        }

        await runContractFunction({
            param: [approveToken0Options, approveToken1Options],
            onSuccess: (tx) => handleApproveSuccess(tx, amount0, amount1),
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function handleApproveSuccess(tx, amount0, amount1) {
        console.log("Adding liquidity...")

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
            onError: (error) => console.log(error),
        })
    }

    async function handleAddLiquiditySuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Liquidity Adding",
            title: "Liquidity Added",
            position: "topR",
        })
    }

    async function setupUI() {
        const returnedShares = await runContractFunction({
            params: {
                abi: dexAbi,
                contractAddress: dexAddress,
                functionName: "getProceeds",
                params: {
                    address: account,
                },
            },
            onError: (error) => console.log(error),
        })
        if (returnedShares) {
            setShares(returnedShares.toString())
        }
    }

    useEffect(() => {
        setupUI()
    }, [shares, account, isWeb3Enabled, chainId])

    return (
        <div className={styles.container}>
            <div className="mb-4">
                Your current shares is <span class="font-bold">{shares}</span>
            </div>
            <Form
                onSubmit={approveAndAddLiquidity}
                data={[
                    {
                        name: "Amount 0",
                        type: "number",
                        value: "",
                        key: "amount0",
                    },
                    {
                        name: "Amount 1",
                        type: "number",
                        value: "",
                        key: "amount1",
                    },
                ]}
                title="Become a Liquidity Provider!"
                id="Main Form"
            />
        </div>
    )
}
