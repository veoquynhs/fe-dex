import styles from "../styles/Home.module.css"
import { useMoralis } from "react-moralis"
import networkMapping from "../constants/networkMapping.json"
import Image from "next/image"

export default function Home() {
    const { chainId, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : null
    const dexAddress = chainId ? networkMapping[chainString].DEX[0] : null

    return (
        <div className="container mx-auto">
            <h1 className="py-4 px-4 font-bold text-2xl">Recently Listed</h1>
            <div className="flex flex-wrap">
                {isWeb3Enabled && chainId ? (
                    <div>Hello</div>
                ) : (
                    <div>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
