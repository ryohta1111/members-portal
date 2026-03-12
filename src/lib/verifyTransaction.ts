// lib/verifyTransaction.ts
// オンチェーンでトランザクション内容を検証する（Festival Staking用・パラメータ化）

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'ab65d07b-9529-4493-a83c-8ec570826be8';

interface VerifyResult {
  ok: boolean;
  actualAmount?: number; // decimals込みの実数値
  error?: string;
}

interface VerifyOptions {
  txHash: string;
  expectedSender: string;
  expectedAmount: number; // decimals込みの実数値（例: 100.5）
  poolWallet: string;
  tokenMint: string;
}

export async function verifyTransaction(opts: VerifyOptions): Promise<VerifyResult> {
  const { txHash, expectedSender, expectedAmount, poolWallet, tokenMint } = opts;
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 3000;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(
        `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: [txHash] }),
        }
      );

      if (!res.ok) return { ok: false, error: 'Helius API error' };

      const data = await res.json();
      const tx = data[0];

      if (!tx) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
          continue;
        }
        return { ok: false, error: 'Transaction not found' };
      }

      if (tx.transactionError) {
        return { ok: false, error: 'Transaction failed on-chain: ' + JSON.stringify(tx.transactionError) };
      }

      // 方法1: tokenTransfers（通常SPL Token）
      const transfer = tx.tokenTransfers?.find((t: any) =>
        t.mint === tokenMint &&
        t.toUserAccount === poolWallet &&
        t.fromUserAccount?.toLowerCase() === expectedSender.toLowerCase()
      );

      if (transfer) {
        const actualAmount = transfer.tokenAmount;
        if (actualAmount < expectedAmount) {
          return { ok: false, error: `Amount mismatch: expected ${expectedAmount}, got ${actualAmount}` };
        }
        return { ok: true, actualAmount };
      }

      // 方法2: tokenBalanceChanges（Token-2022対応）
      let receivedAmount = 0;
      let senderConfirmed = false;

      for (const account of tx.accountData || []) {
        for (const change of account.tokenBalanceChanges || []) {
          if (change.mint !== tokenMint) continue;

          const rawAmount = parseInt(change.rawTokenAmount?.tokenAmount || '0');
          const decimals = change.rawTokenAmount?.decimals || 6;

          if (change.userAccount === poolWallet && rawAmount > 0) {
            receivedAmount = rawAmount / Math.pow(10, decimals);
          }

          if (change.userAccount?.toLowerCase() === expectedSender.toLowerCase() && rawAmount < 0) {
            senderConfirmed = true;
          }
        }
      }

      if (receivedAmount > 0 && senderConfirmed) {
        if (receivedAmount < expectedAmount) {
          return { ok: false, error: `Amount mismatch: expected ${expectedAmount}, got ${receivedAmount}` };
        }
        return { ok: true, actualAmount: receivedAmount };
      }

      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }

      return { ok: false, error: 'Token transfer not found or wrong destination' };
    } catch (err: any) {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, RETRY_DELAY));
        continue;
      }
      return { ok: false, error: err.message };
    }
  }

  return { ok: false, error: 'Verification timed out' };
}
