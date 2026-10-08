"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRouteLoading } from "@/components/shared/nara-loading/RouteLoadingProvider";
import { useNaraStore } from "@/providers/nara-provider";
import { adminPathForView, adminViewForPath } from "../routes";
import { INITIAL_ADMIN_STATE, type AdminUiState } from "./adminConstants";
import { buildAdminModel, type AdminModelApi } from "./adminModel";

export function useAdminScreen() {
  const store = useNaraStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { start: startRouteLoading } = useRouteLoading();
  const viewFromPath = adminViewForPath(pathname) || "home";
  const [state, setSt] = useState<AdminUiState>({ ...INITIAL_ADMIN_STATE, view: viewFromPath });

  const setState = useCallback((patch: Partial<AdminUiState> | ((s: AdminUiState) => AdminUiState)) => {
    setSt((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const go = useCallback(
    (view: string, extra?: Partial<AdminUiState>) => {
      setSt((prev) => ({ ...prev, view, ...extra }));
      const path = adminPathForView(view);
      if (path !== pathname) {
        startRouteLoading();
        router.push(path);
      }
      window.scrollTo(0, 0);
    },
    [pathname, router, startRouteLoading],
  );

  useEffect(() => {
    const u = store.session();
    if (!u || !/Admin/i.test(u.role || "")) {
      router.replace("/ingreso");
      return;
    }
    // Compat: /admin?view=team → /equipos
    const legacyView = searchParams.get("view");
    if (pathname === "/admin" && legacyView) {
      const target = adminPathForView(legacyView);
      const tab = searchParams.get("tab");
      router.replace(tab ? `${target}?tab=${tab}` : target);
      return;
    }
    setSt((prev) => ({
      ...prev,
      view: viewFromPath,
      ...(searchParams.get("tab") === "2" ? { pathTab: "2" } : {}),
      ...(viewFromPath !== "assets"
        ? { assetTerr: "", assetKind: undefined }
        : {}),
    }));
  }, [store, router, searchParams, pathname, viewFromPath]);

  const api = useMemo((): AdminModelApi => {
    const draftFn = (code: string) => {
      if (state.drafts[code]) return state.drafts[code];
      const { r, d } = store.parseCode(code);
      const S0 = store.get();
      const p =
        (S0.pathOverrides && S0.pathOverrides[code]) || store.defaultPath(r, d);
      return { s: { ...p.s }, months: p.months };
    };
    return {
      setState,
      go,
      draft: draftFn,
      setDraft: (code, fn) => {
        const d = JSON.parse(JSON.stringify(draftFn(code)));
        fn(d);
        setState({ drafts: { ...state.drafts, [code]: d } });
      },
      router,
    };
  }, [go, router, setState, state.drafts, store]);

  const v = useMemo(() => buildAdminModel(store, state, api), [api, state, store]);

  return { v, navGo: (key: string) => go(key, { msg: "" }) };
}
