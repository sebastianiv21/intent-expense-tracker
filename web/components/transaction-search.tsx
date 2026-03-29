"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchInputProps = {
  defaultValue?: string;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function SearchInput({
  defaultValue = "",
  disabled = false,
  onChange,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search transactions"
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={onChange}
        className="bg-background pl-9"
      />
    </div>
  );
}

export function TransactionSearch() {
  return (
    <Suspense fallback={<SearchInput disabled />}>
      <TransactionSearchInner />
    </Suspense>
  );
}

function TransactionSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("query", value.trim());
      } else {
        params.delete("query");
      }
      router.replace(`/transactions?${params.toString()}`);
    }, 300);
  }

  return (
    <SearchInput
      defaultValue={searchParams.get("query") ?? ""}
      onChange={handleChange}
    />
  );
}
