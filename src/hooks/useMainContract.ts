import {useEffect, useState} from "react";
import {MainContract} from "../contracts/MainContract";
import {useTonClient} from "./useTonClient";
import {useAsyncInitialize} from "./useAsyncInitialize";
import {Address, Cell, fromNano, OpenedContract, toNano} from "ton-core";
import {useTonConnect} from "./useTonConnect.ts";

export function useMainContract() {
    const client = useTonClient();
    const [contractData, setContractData] = useState<null | {
        counter_value: number;
        recent_sender: Address;
        owner_address: Address;
    }>();

    const { sender } = useTonConnect();

    const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));

    const [balance, setBalance] = useState<number>(0);

    const mainContract = useAsyncInitialize(async () => {
        if (!client) return;
        const contract = new MainContract(
            Address.parse("EQCwtpLoqmNtMQdVkIl4mZEr3wuiqhwRLU6GHAeYJlSyyv_R"),
            { code: Cell.EMPTY, data: Cell.EMPTY}
        );
        return client.open(contract) as OpenedContract<MainContract>;
    }, [client]);

    useEffect(() => {
        async function getValue() {
            if (!mainContract) return;
            setContractData(null);
            const val = await mainContract.getData();
            const { balance } = await mainContract.getBalance();
            setContractData({
                counter_value: val.number,
                recent_sender: val.recent_sender,
                owner_address: val.owner_address,
            });
            setBalance(balance)
            await sleep(5000);
            getValue()
        }
        getValue();
    }, [mainContract]);

    return {
        contract_address: mainContract?.address.toString(),
        ...contractData,
        contract_balance: fromNano(balance),
        sendIncrement: async () => {
            return mainContract?.sendIncrement(sender, toNano("0.05"), 3);
        }
    };
}
