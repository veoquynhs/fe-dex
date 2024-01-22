import styles from "../styles/Home.module.css"
import { Form, useNotification, Button } from "web3uikit"
import { useMoralis, useWeb3Contract } from "react-moralis"
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
            onError: (error) => {
                dispatch({
                    type: "error",
                    title: "❌ Oops!",
                    message: "Error removing liquidity: " + error.message,
                    position: "topR",
                })
            },
        })
    }

    async function handleRemoveLiquiditySuccess(tx) {
        await tx.wait(1)
        dispatch({
            type: "success",
            title: "✅ Removed liquidity successfully!",
            message: "Tx Hash: " + tx.hash,
            position: "topR",
        })
        console.log(tx)
    }

    async function setupUI() {
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
    }

    useEffect(() => {
        setupUI()
    }, [shares, account, isWeb3Enabled, chainId])

    return (
        <div className={`container mx-auto ${styles.main}`}>
            <div className={`flex flex-wrap ${styles.grid}`}>
                {isWeb3Enabled && chainId ? (
                    <div className={styles.card}>
                        <Form
                            onSubmit={removeLiquidity}
                            data={[
                                {
                                    name: "Shares",
                                    type: "number",
                                    value: "",
                                    label: "Enter the shares",
                                    key: "shares",
                                },
                            ]}
                            title="Burn your shares to earn profit!"
                            id="Main Form"
                        />
                        <div className={styles.shareInfo}>
                            Your current shares is <span className="font-bold">{shares}</span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.card}>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
