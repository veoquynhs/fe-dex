import Head from "next/head"
import Image from "next/image"
import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { ethers } from "ethers"
import dexAbi from "../constants/DEX.json"
import networkMapping from "../constants/networkMapping.json"
import { useEffect, useState } from "react"

export default function Home() {
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const dexAddress = chainId ? networkMapping[chainString].DEX[0] : null
    const dispatch = useNotification()
    const [shares, setShares] = useState("0")

    const { runContractFunction } = useWeb3Contract()

    async function removeLiquidity(data) {
        console.log("Removing liquidity...")
        const shares = data.data[0].inputResult

        const removeLiquidityOptions = {
            abi: dexAbi,
            contractAddress: dexAddress,
            functionName: "removeLiquidity",
            params: {
                _shares: shares,
            },
        }

        await runContractFunction({
            params: removeLiquidityOptions,
            onSuccess: (tx) => handleRemoveLiquiditySuccess(tx),
            onError: (error) => console.log(error),
        })
    }

    async function handleRemoveLiquiditySuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Liquidity Removing",
            title: "Liquidity Removed",
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
                onSubmit={removeLiquidity}
                data={[
                    {
                        name: "Shares",
                        type: "number",
                        value: "",
                        key: "shares",
                    },
                ]}
                title="Burn your shares to earn profit!"
                id="Main Form"
            />
        </div>
    )
}
