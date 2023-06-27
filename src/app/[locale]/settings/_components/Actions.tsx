"use client";

import { useAtom, useAtomValue } from "jotai";
import { useState } from "react";
import Button from "~/components/Button";
import Link from "~/components/Link";
import Section from "~/components/Section";
import usePackageAPI from "~/hooks/use-package-api";
import { getStorageKey } from "~/hooks/use-sql-init";
import {
  CONFIG_ATOM_INITIAL_VALUE,
  configAtom,
  selectedPackageAtom,
} from "~/stores";
import {
  LOCALSTORAGE_MAX_CAPACITY,
  getLocalStorageSize,
} from "~/utils/browser";

export default function Actions() {
  const selectedPackage = useAtomValue(selectedPackageAtom);
  const [config, setConfig] = useAtom(configAtom);
  const api = usePackageAPI({ baseURL: selectedPackage?.backendURL });

  const [loading, setLoading] = useState(false);

  async function handler() {
    setLoading(true);

    const { package_id, UPNKey, id } = selectedPackage;

    localStorage.removeItem(getStorageKey(id));
    if (package_id !== "demo") {
      await api.remove({
        packageID: package_id,
        UPNKey,
      });
    }

    const newConfig = { ...config };
    const packageIndex = newConfig.db.packages.findIndex((p) => p.id === id)!;
    newConfig.db.packages.splice(packageIndex, 1);

    if (newConfig.db.packages.length === 0) {
      setConfig(CONFIG_ATOM_INITIAL_VALUE);
      window.location.href = "/";
    } else {
      newConfig.db.selectedId = newConfig.db.packages[0].id;
      setConfig(newConfig);
      window.location.reload();
    }
  }

  // During reset
  if (!selectedPackage) return null;

  return (
    <Section title="Actions">
      <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-2">
        <Button
          asChild
          variant="primary"
          onClick={(e) => {
            const size = getLocalStorageSize();
            if (size >= LOCALSTORAGE_MAX_CAPACITY) {
              e.preventDefault();
              alert("Not enough storage in app");
            }
          }}
        >
          <Link href="/onboarding">Add a new package</Link>
        </Button>
        <Button asChild variant="danger">
          <button
            onClick={(e) => {
              handler();
            }}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete current package"}
          </button>
        </Button>
      </div>
    </Section>
  );
}
