import { ConnectButton } from "web3uikit"
import Link from "next/link"
import styles from "../styles/Header.module.css"

export default function Header() {
    return (
        <nav
            className={`p-5 border-b-2 flex flex-row justify-between items-center ${styles.header}`}
        >
            <h1 className="py-4 px-4 font-bold text-3xl text-white">
                Decentralized Exchange - DEX
            </h1>
            <div className="flex flex-row items-center">
                <Link href="/">
                    <a className={`${styles.navLink} mr-4 p-3`}>Swap</a>
                </Link>
                <Link href="/add-liquidity">
                    <a className={`${styles.navLink} mr-4 p-3`}>Add Liquidity</a>
                </Link>
                <Link href="/remove-liquidity">
                    <a className={`${styles.navLink} mr-4 p-3`}>Remove Liquidity</a>
                </Link>
                <ConnectButton moralisAuth={false} />
            </div>
        </nav>
    )
}
