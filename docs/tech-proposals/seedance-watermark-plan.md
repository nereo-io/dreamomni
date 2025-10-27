# Seedance 模型水印增强方案

## 业务背景
- 非会员用户生成视频存在薅羊毛行为，需要在 Seedance 模型生成的视频中强制加水印。
- 会员用户可选择无水印体验，界面上不展示水印开关，以免产生误解。
- 仅 Seedance 相关模型需要控制水印，其他模型保持原有行为。

## 技术实施方案
- **会员判定**：复用 `useAppContext()` 中的 `membership` 信息，`membership?.status === 'active'` 视为会员，其余情况视为非会员。
- **前端状态管理**：
  - 在 `components/blocks/video-generator/index.tsx` 新增 `watermarkEnabled` 状态。
  - 判断 `isSeedanceModel(selectedModel)` 时，针对非会员默认置为 `true` 且禁用切换；会员时隐藏水印开关。
  - 当模型或会员状态变化时重置 `watermarkEnabled`，确保切换模型后状态正确。
- **交互与文案**：
  - 对非会员展示只读开关，提示为“仅会员可关闭水印”；用户尝试关闭时用 toast 提示。
  - 新增多语言文案（英文、俄文、中文，如需要）以支持新提示与标签。
- **生成参数**：
  - `VideoGenerator` 在构建参数时附带 `watermarkEnabled` 标记。
  - `components/blocks/ai-video-generation-tool/index.tsx` 在调用时根据该标记和模型类型决定是否在 prompt 末尾追加 `--wm true`。默认不传即代表无水印。
  - 确保最终提交至后端的 payload 未新增不必要字段，仅调整 prompt 字符串。
- **回退逻辑**：当用户切换至非 Seedance 模型或会员状态变为激活时，自动移除水印提示并恢复原 prompt。

## 测试用例
1. **非会员 + Seedance 模型**：
   - UI 展示水印开关，默认开启且无法关闭，点击提示“仅会员可关闭水印”。
   - 触发生成后，提交的 prompt 末尾包含 `--wm true`。
2. **会员 + Seedance 模型**：
   - UI 不显示水印开关。
   - 视频生成时 prompt 不追加 `--wm true`。
3. **任意会员状态 + 非 Seedance 模型**：
   - 不存在水印开关，prompt 始终不包含 `--wm true`。
4. **模型切换场景**：先选择 Seedance（非会员看到开关），再切换至其他模型确认开关消失；切回 Seedance 时开关默认开启并仍不可关闭。
5. **未登录用户**：模拟 `membership` 为空和 `user` 为空，确认行为与非会员一致（强制水印）。
