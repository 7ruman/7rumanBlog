# FOC 双版本交付：MATLAB Function vs Simulink 手搭

> 文档库 `D:\PrjBot\foc` 在推进一种"每个模型出两份"的验证方式。这里说清楚为什么，以及怎么对齐。

## 为什么要双版本

同一个观测器/控制器，同时给一份 **MATLAB Function（代码化）** 和一份 **Simulink 基础库手搭（Gain/Sum/Integrator）**，目的是：

- 代码版便于 **集成进产品 MCU 算法**；
- 框图版便于 **审稿和教学**，一眼看懂信号流；
- 两份跑出来行为一致，才算"这个模型对了"。

## 对照示例：滑模观测器（SMO）

代码版核心：

```matlab
function emf = smo(i_alpha, i_beta, v_alpha, v_beta, Ts, L, R)
    % 简单一阶反电动势观测
    persistent z_a z_b;
    if isempty(z_a), z_a = 0; z_b = 0; end
    e_a = v_alpha - R*i_alpha - L*(i_alpha - z_a)/Ts;
    e_b = v_beta - R*i_beta - L*(i_beta - z_b)/Ts;
    z_a = z_a + Ts*(e_a + 100*sign(e_a)) / L;
    z_b = z_b + Ts*(e_b + 100*sign(e_b)) / L;
    emf = [e_a, e_b];
end
```

框图版则是把上面的加减、积分、符号函数拆成 `Sum` / `Integrator` / `Sign` 模块，参数标注在同一处。

## 指标口径的坑

跨环境对比时**只用 `err1`**。注意 `weak_flux` / `mtpa` 里的 `err2` 是个**命名陷阱**——它实际是转速通道的均值，不是误差。

> 跨环境（MATLAB 版本不同、求解器不同）下 `err2` 会有系统偏差，拿它比就是自己骗自己。

## 已识别的空白（按优先级）

- **P0**：IPMSM 凸极中高速观测器、EEMF、Active-Flux、MTPV
- **P1**：参数辨识、死区补偿

所有验证以 `sanity_check.m` 跑通、且与 `all_results.json` 一致为准。

## 两个 plant 约定

| 模型类型 | 用哪个 plant |
|---|---|
| 表贴 PMSM (Ld=Lq) | `pmsm_plant.m` |
| 凸极 IPMSM (Ld≠Lq) | `pmsm_plant_sal.m` |

先把"对不对"验完，再谈"补不补"——这是文档库的硬性顺序。
