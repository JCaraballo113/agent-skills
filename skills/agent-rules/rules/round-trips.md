# `round-trips.md` — the generated rule

Applies to **projects that read over a network** (RPC, HTTP, a database). Generalize the specifics below to the project's own client and batching mechanism.

## Count the round trips

A flow that reads over the wire is designed by its **round trips**, not by its call sites: a lookup that issues four reads one after another is four waits the person sits through, however tidy the code reads. Before such a flow is called done, count them and account for each one.

- **Independent reads go out together.** Two reads are independent when the second needs nothing the first returned. Issue those in one `Promise.all` — a sequential `await` between independent reads is a wait nobody chose. Serializing them anyway is a real decision, to fail fast and skip a wasted call, or to order writes, and it earns a sentence saying which.
- **Reads that share a transport batch.** Where the client offers batching — a multicall contract, a batched RPC, one query with a join — every read that qualifies goes through it.
- **A read that can do neither carries its reason**, in the engineering doc beside the flow: a different host, or a call the batcher does not carry.

## Done when

Every flow a person waits on states its round-trip count where that flow is documented, each read issued after another is either dependent on it or carries the reason it waits, and everything the transport could batch went through the batcher.
