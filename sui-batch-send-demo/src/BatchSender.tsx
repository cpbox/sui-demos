// import { useWallet } from '@mysten/wallet-adapter-react';
// import { Transaction } from '@mysten/sui.js';
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

import { useState } from 'react';

interface Recipient {
  address: string;
  amount: string;
}

export function BatchSender() {
  const account = useCurrentAccount();
  const {mutate: signAndExecute} = useSignAndExecuteTransaction();
  // const { connected, signAndExecuteTransaction } = useWallet();
//   const {} = useSignAndExecuteTransaction();
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length <= 1) return;
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  const handleRecipientChange = (
    index: number,
    field: keyof Recipient,
    value: string
  ) => {
    const newRecipients = [...recipients];
    newRecipients[index][field] = value;
    setRecipients(newRecipients);
  };

  const validateRecipients = (): boolean => {
    // 检查是否有至少一个有效接收者
    const hasValidRecipient = recipients.some(
      (r) => r.address.trim() && r.amount && parseFloat(r.amount) > 0
    );

    if (!hasValidRecipient) {
      setError('至少需要填写一个有效的接收地址和金额');
      return false;
    }

    // 检查所有填写的金额是否有效
    const hasInvalidAmount = recipients.some(
      (r) => r.amount && isNaN(parseFloat(r.amount))
    );

    if (hasInvalidAmount) {
      setError('请输入有效的金额数字');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!account) {
      setError('请先连接钱包');
      return;
    }

    if (!validateRecipients()) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // const tx = new Transaction();
      // // 添加所有有效转账
      // recipients.forEach((recipient) => {
      //   if (recipient.address.trim() && recipient.amount && parseFloat(recipient.amount) > 0) {
      //     const amount = Math.floor(parseFloat(recipient.amount) * 10**9); // 转换为基本单位
      //   //   tx.transferObjects(
      //   //     [tx.splitCoins(tx.gas, [tx.pure(amount)])],
      //   //     tx.pure(recipient.address.trim())
      //   //   );
      //   }
      // });

      let tx = new Transaction();
      for (let i = 0; i < recipients.length; i++) {
        const amount = Math.floor(parseFloat(recipients[i].amount) * 10**9);
        const [coins] = tx.splitCoins(tx.gas, [amount]);
        console.log("coins", [coins])
        tx.transferObjects([coins], tx.pure.address(recipients[i].address));
      }
      const result = await signAndExecute(
        {
          transaction: tx,
          // chain: "sui:mainnet",
        },
        {
          onSuccess: (result) => {
            console.log('Transaction successful:', result);
            console.log('交易成功:', result);
            setSuccess(true);
          },
          onError: (error) => {
            console.error('Transaction failed:', error);
            setSuccess(false);
          },
        }
    );
      // 清空表单
      // setRecipients([{ address: '', amount: '' }]);
    } catch (err) {
      console.error('批量发送失败:', err);
      setError(`发送失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const hasValidRecipients = recipients.some(
    (r) => r.address.trim() && r.amount && parseFloat(r.amount) > 0
  );

  return (
    <div className="batch-sender">
      <h2>SUI批量发送</h2>
      
      {recipients.map((recipient, index) => (
        <div key={index} className="recipient-row">
          <input
            type="text"
            placeholder="接收地址 (0x...)"
            value={recipient.address}
            onChange={(e) => handleRecipientChange(index, 'address', e.target.value)}
            pattern="^0x[0-9a-fA-F]+$"
          />
          <input
            type="number"
            placeholder="金额 (SUI)"
            value={recipient.amount}
            onChange={(e) => handleRecipientChange(index, 'amount', e.target.value)}
            step="0.01"
            min="0.01"
          />
          {recipients.length > 1 && (
            <button 
              onClick={() => handleRemoveRecipient(index)}
              aria-label="删除接收者"
            >
              删除
            </button>
          )}
        </div>
      ))}
      
      <div className="action-buttons">
        <button 
          onClick={handleAddRecipient}
          disabled={recipients.some(r => !r.address || !r.amount)}
        >
          添加接收者
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !hasValidRecipients}
          aria-busy={loading}
        >
          {loading ? '发送中...' : '批量发送'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">批量发送成功！</div>}
    </div>
  );
}

