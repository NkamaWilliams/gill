import {
  SolanaSignIn,
  type SolanaSignInFeature,
  SolanaSignInInput,
  SolanaSignInOutput,
} from "@solana/wallet-standard-features";
import { useMutation } from "@tanstack/react-query";
import { getWalletFeature } from "@wallet-standard/react";

import { useWallet } from "./wallet.js";

type SignInConfig = Omit<SolanaSignInInput, "address">;

export function useSignIn({ config }: { config?: SignInConfig }) {
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
    networkMode: "offlineFirst",
  });

  return {
    error: mutation.error,
    isLoading: mutation.isPending,
    output: mutation.data,
    signIn: mutation.mutateAsync,
  };
}
