Here is the **English translation** of the document you provided .

---

## **Where this model can *really* break if it’s not held together by discipline**

I’m not going to talk about *theoretical risks*, but about **practical stress points** that usually surface **after 6–18 months of growth**.

I’ll break this down by layers so it’s clear **what breaks, why it breaks, and how to fix it**.

---

# **1. Organization vs Account — the main source of future chaos**

## **Where it breaks**

The most common scenario:

> “Let’s allow an office to *own* the customer”
> “Let’s move the Account under an Office”
> “Let’s make Office a mini-tenant”

### **Why this is dangerous**

Right now you **clearly separate**:

* **Organization** → security / ownership
* **Account** → business counterparty

If this line gets blurred:

* ❌ cross-office dispatch breaks
* ❌ billing breaks (who issues the invoice?)
* ❌ history breaks (Account “moved” → data lost)
* ❌ migration pain appears (data must be dragged around)

### **Symptoms that the model is starting to break**

* questions like “who owns the customer?”
* UI requests to “drag a customer to another office”
* requests to “copy a customer into an office”

### **How to fix it (strictly)**

**Never:**

* ❌ make Account a child of Office
* ❌ store customer ownership in Office

**Always:**

* ✔ Account belongs to Corp
* ✔ Office is an assignment (`servicingOrganization`)
* ✔ Moving between offices = changing a reference, not the object

👉 This is a **cornerstone** of the entire architecture.

---

# **2. Roles vs Ownership — a quiet security leak**

## **Where it breaks**

Over time, requests appear:

> “Give this user access to the account”
> “Can he be an admin but not an employee?”
> “Why does he see this if he’s not from this organization?”

### **The danger**

If you start:

* adding flags directly to `User`
* checking access “by logic”
* writing custom `if` statements

→ you are **bypassing the User → Role → Scope model**

### **What this leads to**

* ❌ ACL becomes impossible to explain
* ❌ security bugs are impossible to track
* ❌ auditing becomes impossible
* ❌ enterprise customers lose trust

### **How to fix it**

A strict rule:

> **A User NEVER has permissions by themselves**

Only:

`User → Role → (Organization | Account | Resource)`

If access is needed:

* a **Role** is created
* the role is bound to a scope
* everything else is automatic

---

# **3. Workflow vs “just quickly change the status”**

## **Where it breaks**

Very typical:

> “Can we just change the status?”
> “Can we add a ‘Make Active’ button?”
> “It’s just UI…”

### **Why this is fatal**

A workflow is a **guarantee of integrity**, not decoration.

If you allow:

* direct state changes
* skipping events
* unlogged transitions

Then:

* ❌ history breaks
* ❌ automation breaks
* ❌ AI starts hallucinating
* ❌ support can’t reconstruct what happened

### **Symptoms**

* “It’s unclear why the object is in this state”
* “Is this a bug or a manual change?”
* “Why didn’t automation trigger?”

### **How to fix it**

**Only events. Never `setState` directly.**

Even overrides:

* are **events**
* with an actor
* with a reason

---

# **4. Availability vs Lifecycle (Human / Vehicle / Site)**

## **Where it breaks**

A very common mistake:

> “The person is on vacation → make INACTIVE”
> “Vehicle is under repair → INACTIVE”
> “Site is off-season → INACTIVE”

### **Why this breaks the system**

You already correctly separated:

* lifecycle (alive / deleted / archived)
* availability (usable / unavailable)

If you mix them:

* ❌ dispatch lies
* ❌ reports become garbage
* ❌ planning becomes impossible

### **Symptoms**

* “Why isn’t the driver assigned?”
* “Why did the vehicle disappear?”
* “Why is the site missing from reports?”

### **How to fix it**

Strict rule:

| Type                           | Meaning             |
| ------------------------------ | ------------------- |
| ACTIVE                         | exists              |
| INACTIVE                       | temporarily removed |
| VACATION / BROKEN / INSPECTION | availability        |
| ARCHIVED                       | history             |

If you want it “simpler” — **don’t simplify**, or you’ll pay later.

---

# **5. Task vs Appointment — a hidden complexity explosion**

## **Where it breaks**

Usually during scaling:

> “Let’s do everything through Task”
> “Why do we even need Appointment?”
> “Let’s just attach Site to Task”

### **Why this is wrong**

You correctly designed:

* **Task** = intent / work / case
* **Appointment** = concrete execution in time and space

If you mix them:

* ❌ routing becomes impossible
* ❌ ETA becomes impossible
* ❌ customer visibility becomes impossible
* ❌ multi-stop runs become impossible

### **Symptoms**

* hard to show customers “when we’ll arrive”
* hard to reorder visits
* hard to create repeats

### **How to fix it**

**A Task can exist without an Appointment**
**An Appointment cannot exist without a Task**

This asymmetry is correct — don’t break it.

---

# **6. SYSTEM Organization — the temptation to become “god”**

## **Where it breaks**

As the platform grows, temptation appears:

> “Let SYSTEM see and edit everything”
> “It’s convenient for support”
> “It’s our product”

### **Why this is dangerous**

If SYSTEM starts to:

* directly edit tenant data
* bypass workflows
* change ownership

→ you lose:

* enterprise trust
* legal clarity
* SOC / ISO future

### **How to fix it**

SYSTEM:

* ✔ sees
* ✔ analyzes
* ✔ bills
* ✔ automates through **official events**

SYSTEM **does not own tenant data**.

---

# **7. The most dangerous risk — “just a small exception”**

## **Where everything really breaks**

Not in architecture.

But here:

> “This is a special client…”
> “Let’s add a small hack…”
> “It’s just an edge case…”

After 20 such “edge cases”:

* the model stops being a model
* documentation no longer matches reality
* the team is afraid to touch the code

### **The only cure**

If a case **doesn’t fit the model**:

* either the model is formally extended
* or the case is **forbidden**

There is no middle ground.

