import { ConnectButton } from "web3uikit"
import Link from "next/link"

export default function Header() {
    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <h1 className="py-4 px-4 font-bold text-3xl">Decentralized Exchange</h1>
            <div className="flex flex-row items-center">
                <Link href="/">
                    <a className="mr-4 p-6">Swap</a>
                </Link>
                <Link href="/add-liquidity">
                    <a className="mr-4 p-6">Add Liquidity</a>
                </Link>
                <Link href="/remove-liquidity">
                    <a className="mr-4 p-6">Remove Liquidity</a>
                </Link>
                <ConnectButton moralisAuth={false} />
            </div>
        </nav>
    )
}
