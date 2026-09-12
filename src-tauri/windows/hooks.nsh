; Tauri 2 NSIS has no createDesktopShortcut schema key.
; Default installer only writes Desktop on silent/passive or via the finish-page
; checkbox. This hook always leaves one "Finance Manager.lnk" on Desktop (product
; name + exe icon) and drops leftover cargo-name aliases.

!macro NSIS_HOOK_POSTINSTALL
  Delete "$DESKTOP\finance-manager.lnk"
  Delete "$DESKTOP\FinanceManager.lnk"
  Delete "$SMPROGRAMS\finance-manager.lnk"
  Delete "$SMPROGRAMS\FinanceManager.lnk"
  ${If} $NoShortcutMode != 1
    CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe"
    !insertmacro SetLnkAppUserModelId "$DESKTOP\${PRODUCTNAME}.lnk"
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  Delete "$DESKTOP\finance-manager.lnk"
  Delete "$DESKTOP\FinanceManager.lnk"
!macroend
