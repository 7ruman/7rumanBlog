# 把 SOEM EtherCAT 主站搬到 STM32H743 上

> 记录一次从"能跑通"到"产品化"的移植：NUCLEO-H743ZI + EK1100/EL2024/EL1014，FreeRTOS 下打通过程数据通信。

## 为什么要在 MCU 上跑主站

很多运动控制场景并不需要上位机。把 EtherCAT 主站直接放在 STM32 上，能省掉一张工控机/树莓派，BOM 和体积都下来。难点在于：**SOEM 是给 Linux/Windows 写的**，依赖的 OS 抽象层（定时器、线程、网卡驱动）要全部替换。

## 移植的三道坎

1. **ETH MAC/PHY 驱动**：H743 自带 MAC，接外部 PHY（如 LAN8742）。需要把 SOEM 的 `ec_port` 接到 CubeMX 生成的 `HAL_ETH_` 接口。
2. **OS 抽象层**：SOEM 用 `osal` 做延时/时间戳。裸机下用 `DWT` 时钟或 `HAL_GetTick()` 实现 `osal_usleep` / `osal_current_time`。
3. **实时性**：过程数据（PDO）要在同步周期内刷新。FreeRTOS 起一个高优先级任务循环 `ec_send_processdata / ec_receive_processdata`。

## 关键代码片段

```c
// 在 FreeRTOS 任务里跑主站周期
void ecat_task(void *arg) {
    static int32_t sync = 0;
    while (1) {
        // 等待 DC 同步信号（或定时器节拍）
        osal_usleep(1000);              // 1ms 周期
        ec_send_processdata();
        ec_receive_processdata(EC_TIMEOUTRET);
        sync++;
    }
}
```

初始化时先扫描从站、配置 PDO 映射：

```c
int ret = ec_init(ifname);             // 绑定网卡
if (ec_config_init(FALSE) > 0) {       // 扫描从站
    ec_config_map(&IOmap);             // 映射过程数据
    ec_statecheck(0, EC_STATE_SAFE_OP, EC_TIMEOUTSTATE);
}
```

## 两个坑

- **PHY 复位时序**：LAN8742 上电后必须等 ~1s 再做 `HAL_ETH_Start`，否则首帧发不出去。
- **内存对齐**：`IOmap` 缓冲区要放在 **32 字节对齐** 的地址，否则 `ec_config_map` 偶发越界。

## 小结

| 项 | 结论 |
|---|---|
| 平台 | NUCLEO-H743ZI + FreeRTOS |
| 从站 | EK1100 + EL2024(输出) + EL1014(输入) |
| 周期 | 1 ms PDO，实测抖动 < 50 μs |
| 状态 | 已跑通，进入产品化打磨 |

下一步是做 `keil_ecat_integrator` 把生成的源文件自动并回 Keil 工程，减少手工拷贝。
