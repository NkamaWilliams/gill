import {
  SolanaSignIn,
  type SolanaSignInFeature,
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { useMutation } from "@tanstack/react-query";
import { getWalletFeature } from "@wallet-standard/react";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";
import { useWallet } from "./wallet.js";

type SignInConfig = Omit<SolanaSignInInput, "address">;

interface UseSignInReturn {
  error: Error | null;
  isLoading: boolean;
  output: SolanaSignInOutput | undefined;
  signIn: () => Promise<SolanaSignInOutput>;
}

export function useSolanaSignIn({ config }: { config?: SignInConfig }): UseSignInReturn {
  const { wallet, account } = useWallet();

  const mutation = useMutation<SolanaSignInOutput, Error>({
    mutationFn: async (): Promise<SolanaSignInOutput> => {
      if (!wallet) throw new Error("Wallet not connected");
      if (!account) throw new Error("No account found");

      const signInFeature = getWalletFeature(wallet, SolanaSignIn) as
        | SolanaSignInFeature[typeof SolanaSignIn]
        | undefined;

      if (!signInFeature) {
        throw new Error("Wallet does not implement the sign in feature");
      }

      const [result] = await signInFeature.signIn({ ...config, address: account.address }); // Only getting results from first account
      return result;
    },
    mutationKey: [GILL_HOOK_CLIENT_KEY, "signIn"],
    networkMode: "offlineFirst",
    retry: (failureCount, error) => {
      if (error.message.toLowerCase().includes("denied") || error.message.toLowerCase().includes("rejected"))
        return false; // don’t retry on user rejection
      console.log(error);
      return failureCount < 3;
    },
    retryDelay: (index) => Math.min(1000 * 2 ** index, 3000),
  });

  return {
    error: mutation.error,
    isLoading: mutation.isPending,
    output: mutation.data,
    signIn: mutation.mutateAsync,
  };
}
