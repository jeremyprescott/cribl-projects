# Remove Null Fields

## Overview

The `remove-null-fields` function is designed to clean up events by removing fields that are either null or empty. (Except `_raw`, `_time`, `__*`)

## Features

- **Remove fields with null values**: Option to remove fields that have `null` values.
- **Remove fields with empty values**: Option to remove fields that are empty (i.e., have a length of zero or are empty strings).

## Use Cases

Typically, users will configure a Parser Function with the following configuration to extract a JSON object and remove null and empty fields:

- **Operation Mode**: `Extract`
- **Type**: `JSON Object`
- **Source Field**: `_raw`
- **Fields Filter Expression**: `value != '' && value != null`

Because the `Fields Filter Expression` is a JavaScript expression field, Cribl has to interpret the JavaScript and build the expression to evaluate the keys in the event. This process is not very performant (see benchmarks below).

The `remove-null-fields` function, on the other hand, directly traverses each key in the event and explicitly checks if the fields are null or empty. This direct evaluation is significantly more performant (see benchmarks below).

## Benchmarks

The benchmark sample below demonstrates that using the Parser Function with the built-in `Fields Filter Expression` to remove empty and null fields is more expensive compared to using the Parser Function without removal and the `remove-null-fields` function.

**Test System:**
- **Cribl Stream Version/Build**: `4.7.3-6f48361f`
- **AWS Instance Type**: `c7g.large`

**Results (tl;dr):**
- **Parser Function with Built-in Removal**: `117676.96ms`
- **Parser Function + Remove Null Fields Function**: `3042.37ms`

### Sample Event

```json
{"_raw":"{\"j93w\": null,\"jbe2a\": null,\"59dghh\": null,\"dd6q4\": null,\"ywrjn\": null,\"jddlr\": null,\"x377y\": null,\"u151fh\": null,\"3rx4c\": null,\"lu04lj\": null,\"7bljv\": null,\"la80lk\": null,\"qr7w4\": null,\"myc9cf\": null,\"o0f44\": null,\"t2mx4\": null,\"u3y3\": null,\"3oe68\": null,\"tvhzc\": null,\"v355s\": null,\"0y7nxk\": null,\"kxu6eh\": null,\"1vlyoj\": null,\"las3si\": null,\"8gtus\": null,\"6h74uj\": null,\"ecakx\": null,\"35j54\": null,\"7f99h\": null,\"5ic71\": null,\"jg1zv\": null,\"zzj69\": null,\"n2kq6\": null,\"5zbs7\": \"\",\"m5hfj\": \"\",\"nuwfh\": \"\",\"svh79\": \"\",\"6m01z\": \"\",\"3mbhw\": \"\",\"c2mjo\": \"\",\"t20xcf\": \"\",\"ygjpf\": \"\",\"06nn2\": \"\",\"3lgr4g\": \"\",\"x3bcz\": \"\",\"h5y93j\": \"\",\"jbpwx\": \"\",\"lbhar\": \"\",\"kbkkp\": \"\",\"z4pk0h\": \"\",\"fkpolk\": \"\",\"2nezn\": \"\",\"zj012\": \"\",\"nyxmvi\": \"\",\"brr45f\": \"\",\"8wkry\": \"\",\"g5cuz\": \"\",\"o6kgj\": \"\",\"pld7j\": \"\",\"7eiqx\": \"\",\"0ckf2\": \"\",\"ooyvr\": \"\",\"9rbxn\": \"\",\"b5m1m\": \"\",\"cf1rhi\": \"\",\"4xevp\": \"\",\"vo2bo\": \"e7knwk\",\"5o553\": \"nc0qa\",\"1kncn\": \"tw398\",\"9pwe9\": \"1931s\",\"1gat7\": \"om8y7\",\"mmd3l\": \"d9k6k\",\"wxxq2\": \"634tz\",\"4ue14\": \"wh6wl\",\"jkg7\": \"7bf5b\",\"z8wpp\": \"vekai\",\"d04j5\": \"5tvvr\",\"zd075\": \"lzaga\",\"fqxh4k\": \"e06tq\",\"zfnrt\": \"30oqz\",\"dzzkl\": \"oj5cj\",\"klgpll\": \"s2jatk\",\"qcr1mj\": \"tv7bgg\",\"wh86h\": \"y4rpc\",\"6epwz\": \"lco99k\",\"653nb\": \"c5kodl\",\"jvbi4\": \"mpzhv\",\"eqduc\": \"dapqwh\",\"1p5cm\": \"lngytl\",\"8s1pr\": \"qx2xo\",\"1d8qdj\": \"v9z9h\",\"xh4b3\": \"io25s\",\"4xt0tj\": \"dw3ssf\",\"8i5zc\": \"lw3it\",\"6ly0j\": \"1mee4\",\"fa9qr\": \"pzyop\",\"mctrc\": \"53a0a\",\"5mpyai\": \"rj6rd\",\"xt9fj\": \"24gnc\",\"40k0w\": \"83ltrk\"}"}
```

### Parser Function with Built-in Removal

**Parser Function Configuration:**
- **Operation Mode**: `Extract`
- **Type**: `JSON Object`
- **Source Field**: `_raw`
- **Fields Filter Expression**: `value != '' && value != null`

Running a sample file with `100,000` events through the Parser Function took **`117676.96ms`**:

```shell
$ cat /opt/sample_events/100_000.json | /opt/cribl/bin/cribl pipe -t -p ParserFunction 2>/dev/null
{
    "functions": [
        {
            "bytesIn": 181200000,
            "bytesOut": 237000000,
            "duration": 117676.9628769923,  // oof
            "eventsIn": 100000,
            "eventsOut": 100000,
            "func": "serde"
        }
    ]
}
```

### Parser Function without Removal and the `remove-null-fields` Function

**Parser Function Configuration:**
- **Operation Mode**: `Extract`
- **Type**: `JSON Object`
- **Source Field**: `_raw`

**Remove Null Fields Configuration:**
- **Remove fields with null values**: `True`
- **Remove fields with empty values**: `True`

Running a sample file with `100,000` events through the Parser Function and the `remove-null-fields` function took **`3042.37ms`**:

```shell
$ cat /opt/sample_events/100_000.json | /opt/cribl/bin/cribl pipe -t -p ParserAndRemoveNullFunction 2>/dev/null
{
    "functions": [
        {
            "bytesIn": 181200000,
            "bytesOut": 317800000,
            "duration": 2396.6148200142197, // woahhhhhh
            "eventsIn": 100000,
            "eventsOut": 100000,
            "func": "serde"
        },
        {
            "bytesIn": 317800000,
            "bytesOut": 237000000,
            "duration": 645.7600999730639,   // sheeeeeeeesh
            "eventsIn": 100000,
            "eventsOut": 100000,
            "func": "remove-null-fields"
        }
    ],
}
```
