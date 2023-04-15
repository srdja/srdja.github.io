---
layout: post
title:  "Deque as a circular buffer"
date:   2017-06-06
tags: [programming]
author: Srđan Panić
---

A Double-ended queue, or [*deque*](https://en.wikipedia.org/wiki/Double-ended_queue) ([code](https://github.com/srdja/Collections-C/blob/master/src/deque.c)), is a data type to which elements can be added and removed from both ends. In a sense, a deque can be viewed as two overlapping queues of opposite directions merged together to form a new type.

This is what a deque is supposed to be on some higher level. And of course this abstract definition is useful when we're simply thinking about it, but before we can use it to solve a real problem, it must first assume a more concrete form. We must first translate this abstract definition into real code that runs on real machines. So how do we then go about doing this?

There are many different ways to do this. We can implement it as a doubly linked list, or as an array of fixed size arrays (which is a fairly common implementation) or as anything else that can satisfy the high level definition. We have many options to choose from. However, as you can already tell by the title, we'll be focusing on one specific implementation, the *circular buffer*.

### Buffer layouts

Since a circular buffer is nothing more than a way of arranging data within an array, it might be useful for us to step back a bit from thinking about deques and circular buffers, and first take a quick look at the some of the ways we might grow an element sequence within a plain old linear array.

This can help us better illustrate our problem of trying to **grow the element sequence from both ends equally efficiently**, because as we know, arrays, unlike lists, can be very rigid structures, and moving things around in them can be very expensive. And this expensive movement is something we want to avoid as much as possible.

So let's start with the simplest case. Suppose we have an array `a, b, c` and we want to add `d` to the back of the array:

```
  0   1   2   3   4   5   6   7   8   9   10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ a │ b │ c │ d │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
              ^
              └─── new
```

No big deal, we simply write `d` at index `3`, which is the first free slot in the array starting from the beginning. No copying, nothing moved. It's as simple and efficient as it gets. This is how we would usually fill an array when we add to the back of the sequence.

Now suppose that we don't just want to add elements to the back, but also to the front. If we now add `d` to the front instead, we have to move all existing elements to the right to make room `d` for before adding it.

```
  0   1   2   3   4   5   6   7   8   9   10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ d │ a │ b │ c │   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  ^   ^^^^^^^^^
  │           └─── moved
  │
  └───  new
```
And as you can see, this is slightly more complicated, and nowhere near as efficient as the previous example of simply adding to the back. Here we first had to move everything and then add.

This performance asymmetry is something we want to avoid. We want to make insertions at both ends equally efficient. So we need to come up with something better.

Another slightly better thing that we might do is to start filling the buffer from the middle. This way we can minimize the number of buffer moves. We only need to recenter it when we reach one of the edges.


```
  0   1   2   3   4   5   6   7   8   9   10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│   │   │   │   │ d │ a │ b │ c │   │   │   │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                  ^
                  │
          new  ───┘
```

This is a better better approach than the two previous ones, but it still not exactly there yet. For example, the buffer's growth direction can be unpredictable, so if the buffer starts growing only in one direction the performance is going to be much poorer then if the buffer were to grow in both directions equally. We would be hitting one of the edges more frequently and thus would have to move the buffer around more frequently too.

Which brings us to circular buffers...

### Circular buffer

A circular buffer arrangement helps us smooth out the performance on this irregular buffer growth. It does this by getting rid of the buffer edges. Or at least by pretending that they don't exist by treating the buffer as a finite but unbound.

But what does this really mean? To illustrate, let's revisit the example where we added `d` to the front of the array.

Previously when we wanted to add an element to the front of the array we had to move all the existing elements to the right to make room for the new one. This is what we had to do when we treated the buffer as a linear array. But how would this work in circular buffer? Well, in a circular buffer arrangement we wouldn't have to move anything. We would simply write `d` at index `10` instead, because `10` comes after `0` if we circle around to the left.

```
  0   1   2   3   4   5   6   7   8   9   10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ a │ b │ c │   │   │   │   │   │   │   │ d │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
                                          ^
                                          │
                                  new  ───┘
```

You can see here that the sequence simply wraps around without moving anything which is exactly what we want for symmetric insertion performance.

To better visualize this, we can take a look at this example of a buffer that grows randomly in both directions:
<div class="highlighter-rouge">
  <pre class="highlight">
  <code id="c-buffer">
         0   1   2   3   4   5   6   7   8   9   10
       ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
 +--◀  │   │   │   │   │   │   │   │   │   │   │   │  ▶--+
 |     └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘     |
 |                                                       |
 |                                                       |
 |                                                       |
 |                                                       |
 +-------------------------------------------------------+
                    "connected" ends

  h (head)
  t (tail)
</code>
  </pre>
</div>

(The upper indices are the array indices, while the lower ones denote the **relative sequence indices**. Also using the `head` and `tail` pointers, we keep track of the sequence position within the buffer)

### Virtual indices

Now you might be wondering how do we actually keep track of sequence position and how do we know when to warp around. It's one thing to say "we wrap around" when we talk about it abstractly, and another to actually do it. At first, it might seem like keeping track of how the buffer is positioned is fairly complicated. But it actually isn't. There is a simple trick to keep this really simple. And that trick is **virtual indices**.

So what exactly are these virtual indices? We know what array indices are, we know what relative sequence indices are, but to see what virtual indices are and why they're useful, we need another example.

Suppose we have an array with elements `a`, `b` and `c` at array indices `8`, `9` and `10`, where `10` is the also the highest index of the array. And now, suppose we want to add `d` after `c`. To which index do we add it? Well, of course, the one that comes after `10`, which would be index `11`. But as we know, this index doesn't actually exist (not unless we want to overflow). So what do we do? We calculate the its virtual position within the array.

```
  0   1   2   3   4   5   6   7   8   9   10   <--- array indices
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ d │   │   │   │   │   │   │   │ a │ b │ c │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  3                               0   1   2    <--- sequence indices

  0   1   2   3   4   5   6   7   8   9   10   <--- virtual indices
  11  12  13  14  15  16  17  18  19  20  21
  ^
  │
  └─ new
```
Which turns out to be at array index `0`.

As you can see virtual indices are a convenient abstraction because they let us forget about the fact that the buffer is finite. We can freely add to the front and the back of the virtual sequence and not worry about how the sequence actually maps onto the array.

Of course the buffer cannot hold more elements than its capacity, but we could theoretically calculate the array position of any *nth* virtual index:

<div class="highlighter-rouge">
  <pre class="highlight">
  <code id="anim-virtual">
  0   1   2   3   4   5   6   7   8   9   10       
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐      
│   │   │   │   │   │   │   │   │   │   │   │      
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘      
  ^                                                
  │                                                
  0                                                
</code>
  </pre>
</div>

So in other words, virtual indices let us detach ourselves from the raw array index range.

### Calculating virtual indices

So how do we then map virtual indices to array indices? How do we, for example, map a virtual index `42` to an array of capacity `11`?

There is one very simple way to do this and that is to get the remainder of the division of the virtual index by the capacity of the array:

```
array_index = virtual_index % array_capacity
```

To see why this works, we can imagine the virtual index as a number of wrap-arounds around the array plus the remainder, or the *incomplete* wrap around which gives us the actual position.

To illustrate let's take this concrete example:

```
9 = 42 % 11
```

The remainder `9` that we get from using the `%` operator is the final incomplete wrap around which is where the array position of the virtual index `42` is.

Let's now go back and apply this to the array example where we added the an element after the highest index (`10`) in the array:

```
  0   1   2   3   4   5   6   7   8   9   10
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ d │   │   │   │   │   │   │   │ a │ b │ c │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘
  0   1   2   3   4   5   6   7   8   9   10
  11
  ^
  │
  └─ new
```
Now that we know how this works, we can clearly see why virtual index `11` maps to array index `0`:

```
0 = (10 + 1) % 11
```

As you can see this is very simple method of array cycling, but there's a catch. What happens when we try to cycle backwards? We know that `10 + 1` works, but happens with the case of `0 - 1` when we want to add to the front? Calculating the array index using `%` will, sadly, give us the wrong result. This is an edge case that we have to handle separately when using this method of array cycling.

But cycling through an array with `%` is not the only way to cycle through an array. Besides, `%` is a relatively expensive operation and we want to minimize the overhead of this operation since we have to calculate it every time we want to access the array. 

#### Cycling with `&` (*bitwise and*)

Another way to cycle through an array is to use the *bitwise and* operator (`&`). This method might be slightly less obvious than the `%` method, but it does offer some advantages. However it does have a drawback, which is that it only works when the array capacity is a **power of two**.

The way we calculate the virtual index position is slightly different than with `%`. We don't *and* (`&`) the virtual index with the capacity, but rather we `&` it with array capacity minus one (remember the capacity needs to be a power of two for this to work):

```
array_index = virtual_index & (array_capacity - 1)
```

At first glance this might not be obvious as to what is really happening here, so let's break it down and see why it really works.

We've said earlier that this method only works with power of two buffer sizes. Since `&` is a bitwise operation, it is helpful to see how these values are represented in binary in order see what's really going on:

```
2^0 = 0 0 0 0 0 0 0 1
2^1 = 0 0 0 0 0 0 1 0
2^2 = 0 0 0 0 0 1 0 0
2^3 = 0 0 0 0 1 0 0 0
2^4 = 0 0 0 1 0 0 0 0
2^5 = 0 0 1 0 0 0 0 0
2^6 = 0 1 0 0 0 0 0 0
2^7 = 1 0 0 0 0 0 0 0
```
You can see that the pattern here is that as we double the size, the digit `1` moves one spot to the left, or in other words, each binary digit represents a single power of two value, and this is, of course, nothing new.

However, the interesting part happens when we subtract `1` from these values:

```
2^0 - 1 = 0 0 0 0 0 0 0 0
2^1 - 1 = 0 0 0 0 0 0 0 1
2^2 - 1 = 0 0 0 0 0 0 1 1
2^3 - 1 = 0 0 0 0 0 1 1 1
2^4 - 1 = 0 0 0 0 1 1 1 1
2^5 - 1 = 0 0 0 1 1 1 1 1
2^6 - 1 = 0 0 1 1 1 1 1 1
2^7 - 1 = 0 1 1 1 1 1 1 1
```

What we get here is that all trailing zeroes turn into ones, while the one turns into a zero. But why is this useful? Well, the reason why this is useful is because it forms a bit mask for all the values that are not in the index range for the given capacity.

Okay, this may sound a little opaque, so let's illustrate this with a concrete example.

Say we have an array of capacity `16` and we want to add an element at virtual index `181`. Our capacity of `16` can be represented in binary as:

```
0 0 0 1 0 0 0 0
```

When we subtract `1` from `16` we get `15`, the highest index of our array, which is **very conveniently represented** as:

```
0 0 0 0 1 1 1 1
```

This is convenient because the bits marked by ones can hold all the values from `0` to `15`, which is exactly the index range of our array, while the leading zeroes **mask out** anything beyond this range. 

If we now represent our virtual index `181` in binary, we get:

```
1 0 1 1 0 1 0 1
```

Now when we apply our (`capacity - 1`) mask with bitwise *and* to our virtual index we get the position of the virtual index in the array:

```
[1 0 1 1 0 1 0 1]
                   &
[0 0 0 0 1 1 1 1]
                   =
[0 0 0 0 0 1 0 1]
```

Our result here is `0 0 0 0 0 1 0 1` or `5`, which is exactly what we would have gotten if we had used `%` method instead, because `181` wraps around (`16`) eleven times with the remainder of five.

Here we can see the full 8 bit range cycle with capacity of `16`:

<div class="highlighter-rouge">
  <pre class="highlight">
  <code id="binary-cycle">
[0 0 0 0 0 0 0 0]  = 0     <--- virtual index
 
&

[0 0 0 0 1 1 1 1]  = 15    <--- bit mask 

=

[0 0 0 0 0 0 0 0]  = 0     <--- array index
</code>
  </pre>
</div>

#### The negative index edge case

But what about the *negative index* edge case that we've mentioned earlier when we talked about modulo cycling? 

The good thing about `&` cycling is that this edge case simply disappears. If we use unsigned integers for our indices (which we should anyway), subtracting from zero will simply cause an unsigned integer underflow. For example `0 - 1` would simply wrap around to it's maximum value.

While it might seem a bit hackish to rely on this, the fact is that unsigned integer overflow is very well defined in the C language standard.

### `&` vs. `%`

We have now seen how both array cycling methods work, however the question that now remains is which one should we prefer to use.

If we can't afford to have our array sizes constrained to powers of two, then it's obvious that we can't use the `&` method. We should use `%` instead. But what if we don't mind using arrays with power of two sizes? Well, then the first question we might ask is which one of these two methods is faster. In theory `&` operation should be faster than `%`, but we can't simply assume this to be true in practice. Modern compilers can be very clever in optimizing these sorts of operations and the best way to find for sure is to test it ourselves.

For this we can write a simple test program that will run each operation through a billion or billion + 1 iterations: 

```c
#include <stdlib.h>
#include <time.h>
#include <stdio.h>

#define TEST(name, exp) \
    printf("Running test for %s...\n", name); \
    start = clock(); \
    for (size_t i = 0; i < 1000000000 + extra_spin; i++) \
        test_array[exp] = value; \
    end = clock(); \
    end_time = (double)(end-start) / CLOCKS_PER_SEC; \
    printf("Elapsed time: %f\n\n", end_time);


int main(int argc, char **argv) {
    srand(time(NULL));

    clock_t start;
    clock_t end;
    double  end_time;
    size_t  capacity = 0x0001 << ((rand() % 2) + 4);
    size_t  extra_spin = rand() % 2;
    size_t  value = rand() % 10000;
    size_t  *test_array = malloc(sizeof(size_t) * capacity);

    TEST("MOD", i % capacity)
    TEST("AND", i & (capacity - 1))

    printf("%lu\n", test_array[0]);

    return 0;
}
    
```
Writing a test for this can be a bit tricky because the compiler's cleverness is actually working against us in this case. The problem with simple test programs, like this one, is that the compiler can infer a lot about how the code is used and what the result of the program should be, and thus optimize away certain things that it otherwise wouldn't be able to optimize.

As you can see many values are defined with `rand`. This is because want these values to be defined at runtime, just like they would be in a "real world" situation. This prevents the compiler from doing all sorts of  clever optimizations with constants at compile time. And even though there is a slight variation in values, none of them should affect performance in any significant way.

Also, if your wondering what is the purpose of the `printf` at the end of the program, it is there to prevent *clang* from realizing that we aren't really doing anything with the code, other than just heating up the processor. Without it, it will completely skip over the code, which is not what we want.

Alright, now that we have our test code, let's compile it with `gcc` and run it:

```bash
Building "gcc -O0 -o test test.c"
Running test for MOD...
Elapsed time: 11.313650

Running test for AND...
Elapsed time: 2.304911

9546
Building "gcc -O1 -o test test.c"
Running test for MOD...
Elapsed time: 10.165761

Running test for AND...
Elapsed time: 0.643492

6083
Building "gcc -O2 -o test test.c"
Running test for MOD...
Elapsed time: 10.206719

Running test for AND...
Elapsed time: 0.563383

7553
```

and do the same with `clang`

```bash
Building "clang -O0 -o test test.c"
Running test for MOD...
Elapsed time: 11.419911

Running test for AND...
Elapsed time: 2.650620

3333
Building "clang -O1 -o test test.c"
Running test for MOD...
Elapsed time: 10.177583

Running test for AND...
Elapsed time: 0.643640

8722
Building "clang -O2 -o test test.c"
Running test for MOD...
Elapsed time: 8.282673

Running test for AND...
Elapsed time: 0.429604

905
```

From this we can clearly see that the `&` method is not just slightly faster than `%`, but in some cases up to 20 times faster! These results are also consistent across multiple runs, so there is very little chance that they're a result of a fluke. Of course the there's always the chance that the test itself is flawed in some non-obvious way, but I think it's unlikely.

Overall I would say that there is very little reason not to use `&` over `%`, unless power of two buffer sizes are not acceptable.

# The deque structure

Once we know how circular buffers work, implementing basic deque operations is fairly straightforward, but before we delve into their inner workings, let's first take a look at the central piece, which is the deque struct itself:


```c
struct deque_s {
    size_t   size;
    size_t   capacity;
    size_t   first;
    size_t   last;
    void   **buffer;

    void *(*mem_alloc)  (size_t size);
    void *(*mem_calloc) (size_t blocks, size_t size);
    void  (*mem_free)   (void *block);
};

typedef struct deque_s Deque;
```

The `Deque` structure is basically a modified dynamic array structure that has all the fields that the a array has with the exception of two extra fields: `first` and `last`. These two fields tell us how the sequence is positioned within the buffer, and how the sequence is supposed to grow. Other fields such as `size` tell us how many elements the `buffer` currently holds, `capacity` is the maximum number of elements the `buffer` can hold and finally the `buffer` field is a pointer to a linear chunk of memory of size `capacity * sizeof(void*)`.

Since the `Deque` structure is [*opaque*](https://en.wikipedia.org/wiki/Opaque_data_type), it has to be initialized with either `deque_new_conf` or the `deque_new` function (which calls `deque_new_conf` internally with default configuration):


```c
enum cc_stat deque_new_conf(DequeConf const * const conf, Deque **d)
{
    Deque *deque = conf->mem_calloc(1, sizeof(Deque));

    if (!deque)
        return CC_ERR_ALLOC;

    if (!(deque->buffer = conf->mem_alloc(conf->capacity * sizeof(void*)))) {
        conf->mem_free(deque);
        return CC_ERR_ALLOC;
    }

    deque->mem_alloc  = conf->mem_alloc;
    deque->mem_calloc = conf->mem_calloc;
    deque->mem_free   = conf->mem_free;
    deque->capacity   = upper_pow_two(conf->capacity);
    deque->first      = 0;
    deque->last       = 0;
    deque->size       = 0;

    *d = deque;
    return CC_OK;
}
```

As you can see, there is nothing all that interesting happening here. We allocate memory for the structure and the buffer and we initialize all the fields. However, there is one small, but important thing here, and that is that both `first` and `last` fields are initialized to `0` which makes them overlap initially.

```
         0   1   2   3   4   5...
       ┌───┬───┬───┬───┬───┬───
       │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───
         ^ 
         │ 
   first ┴ last
```
We'll soon see how this effects the way we add elements to both the back and the front of the deque.

### Adding elements to the edges

Adding elements to the edges of a circular buffer are fairly simple operations once we know how buffer cycling works. However, there are still some important things we should pay attention to.

So let's take a look at how these two operations are implemented:

- adding to the front (or first / head):

```c
enum cc_stat deque_add_first(Deque *deque, void *element)
{
    if (deque->size >= deque->capacity && expand_capacity(deque) != CC_OK)
        return CC_ERR_ALLOC;

    deque->first = (deque->first - 1) & (deque->capacity - 1);
    deque->buffer[deque->first] = element;
    deque->size++;

    return CC_OK;
}
```

- and to the back (or last / tail):

```c
enum cc_stat deque_add_last(Deque *deque, void *element)
{
    if (deque->capacity == deque->size && expand_capacity(deque) != CC_OK)
        return CC_ERR_ALLOC;

    deque->buffer[deque->last] = element;
    deque->last = (deque->last + 1) & (deque->capacity - 1);
    deque->size++;

    return CC_OK;
}
```

If you look carefully, you'll notice that these two operations are *almost* identical, but not quite. There is a small difference. When we add to the front (or first) we first update the index and then write an new element to that new index. But when we add to the back (or last), we first write to the old index and then update. 

But why is this so? To explain, let's first take a closer look at what actually happens when we perform these operations so that we can see more clearly why this is necessary.

We know that when we start out with a new deque, both of the deque's `first` and `last` sequence pointers are overlapping:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │   │   │   │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───┴───┴───┘
         ^ 
         │ 
   first ┴ last
```
However, this is not only the case with newly created deques. Whenever a deque is in a state where it is empty, either by having all of its existing elements removed or by being freshly created, the `first` and `last` pointers will always end up overlapping each other. They may not always overlap at index `0`, like they do in a newly created deque, but that won't change the way we add new elements to it.

So how do we add elements to it? And why are these two *add* operations mirrored like this? The best way to see why, is to show what happens when we **don't** mirror them.

Suppose these two operations are not mirrored and we used `write + move` order for both of them. Now if we wanted to add the element `a`  to our empty deque via `deque_add_last`:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │ a │   │   │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───┴───┴───┘
         ^   ^
         │   └ last
         └ first
```

The element `a` is added at index `0` and the `last` pointer is moved forward, in other words we're doing a `write + move` operation. If we kept filling the deque this way, all would be good and we wouldn't encounter any problems.

However, what would happen if we were to now add another element `b`via `deque_add_first`? 

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │ b │   │   │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───┴───┴───┘
             ^                       ^
             └ last                  └ first
```
We do a `write + move` operation again, which means that we write element `b`to index `0` and then move the `first` pointer to `first - 1` position.

As you can see, we have just overwritten the element `a` with `b`! This is obviously not good. If we treat both `add_first` and `add_last` operations the same way we're in trouble. And despite the fact that we are moving in different direction with these operations we still have a problem of overwriting.

We would also have a similar problem if we were to use `move + write` order for both operations instead of `write + move`:

- `deque_add_last`:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │   │ a │   │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───┴───┴───┘
         ^   ^
         │   └ last
         └ first
```
- and then `deque_add_first`:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │   │ a │   │   │   │   │   │ b │
       └───┴───┴───┴───┴───┴───┴───┴───┘
             ^                       ^
             └ last                  └ first
```
This time we haven't overwritten anything, which is technically better, but we have made a gap in the buffer at index `0` instead, and that is definitely not something we want to do.

The solution to this problem, as we have seen, is to flip the order of write and move operations for one of the *add* operations so that they end up being mirror images of each other like so:

```c
    deque->buffer[deque->last] = element;
    deque->last = (deque->last + 1) & (deque->capacity - 1);
```
and

```c
    deque->first = (deque->first - 1) & (deque->capacity - 1);
    deque->buffer[deque->first] = element;
```

Here we do `write + move` for `add_last` and `move + write` for `first`. However, there is nothing special in doing it this way. We might as well have done it the other way around by having `move + write` order for `add_last` and `write + move` order for `add_first`. The effect would have been exactly the same. The important thing is that they're mirror images of each other.

So when we do mirror them we get the correct result:

`deque_add_last`:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │ a │   │   │   │   │   │   │   │
       └───┴───┴───┴───┴───┴───┴───┴───┘
         ^   ^
         │   └ last
         └ first
```
We write to where the `last` pointer is currently pointing at and then move it. Then when we use `deque_add_first`:

```
         0   1   2   3   4   5   6   7
       ┌───┬───┬───┬───┬───┬───┬───┬───┐
       │ a │   │   │   │   │   │   │ b │
       └───┴───┴───┴───┴───┴───┴───┴───┘
             ^                       ^
             └ last                  └ first
```
we move the `first` pointer and then write to the new position and everything works like clockwork.

### Removing elements from the edges

Conceptually, removing elements from the edges is not much different from adding elements to the edges. In fact we do not even have to modify the buffer to remove something from the sequence edge, we only have to move pointers around.

Suppose we have a deque containing elements `a, b, c, d`:

```
      0   1   2   3   4   5   6   7 
    ┌───┬───┬───┬───┬───┬───┬───┬───┐
    │ a │ b │ c │ d │   │   │   │   │
    └───┴───┴───┴───┴───┴───┴───┴───┘
      ^               ^
      │               └ last
      └ first

```

Now if we want to "remove" the first element in the sequence, all we really have to do is to move the `first` pointer by one towards the other end.

```
      0   1   2   3   4   5   6   7 
    ┌───┬───┬───┬───┬───┬───┬───┬───┐
    │ a │ b │ c │ d │   │   │   │   │
    └───┴───┴───┴───┴───┴───┴───┴───┘
          ^           ^
          │           └ last
          └ first

```
You can see that we haven't actually removed anything from the buffer. The value is still there. However, we have hidden it from the user by making it unreachable through the API. 

Implementing this operation is fairly straightforward, but since we also want to optionally return the stored pointer value to the user in addition to hiding the value, we have to again pay attention to the order of (this time) `read` and `move` operations which is defined by the `add` operations:

With `deque_remove_first` we first read the `element` at `first`, since `first` pointer points directly to the sequence head and then update its position:

```c
enum cc_stat deque_remove_first(Deque *deque, void **out)
{
    if (deque->size == 0)
        return CC_ERR_OUT_OF_RANGE;

    void *element = deque->buffer[deque->first];
    deque->first = (deque->first + 1) & (deque->capacity - 1);
    deque->size--;

    if (out)
        *out = element;

    return CC_OK;
}
```

and finally with `deque_remove_last`, we first calculate the new position since `last` is pointing ahead of the sequence end:

```c
enum cc_stat deque_remove_last(Deque *deque, void **out)
{
    if (deque->size == 0)
        return CC_ERR_OUT_OF_RANGE;

    size_t last = (deque->last - 1) & (deque->capacity - 1);
    void *element = deque->buffer[last];
    deque->last = last;
    deque->size--;

    if (out)
        *out = element;

    return CC_OK;
}
```

### In conclusion

While we can certainly go on exploring other deque operations, these so far cover the conceptual basics upon which all other operations are built. 

<script>
/*****************************
 *
 * Hackish text animation code
 *
 ****************************/
const capacity = 8;
const cell_offset = 4;

const anim_virtual_index_cell_offset = 68;
const anim_virtual_index_vindex_offset = 138;

const anim_circular_buffer_cell_offset = 111;
const anim_circular_buffer_vindex_offset = 229;


function set_cell_at(text, i, str, offset) {
    var pos = ((i + 1) * cell_offset) + offset;
    for (var j = 0; j < str.length; j++) {
        pos = pos + j;
        text[pos] = str.charAt(j);
    }
}

function insert_row(text_canvas, string, offset) {
     for (var i = 0; i < string.length; i++) {
         text_canvas[offset + i + 1] = string.charAt(i);
    }
}

function insert_column(text_canvas, string, offset) {
    var column_offset = offset;
    while (column_offset > 0 && text_canvas[column_offset] != '\n') {
        column_offset--;
    }
    column_offset = offset - column_offset - 1;

    for (var i = 0; i < string.length; i++) {
        text_canvas[offset] = string.charAt(i);
        while (text_canvas[offset++] != '\n');
        offset += column_offset;
    }
}

function get_cell_at(text, i, offset) {
    var final_offset = ((i + 1) * cell_offset) + offset;
    return text[final_offset];
}

function set_vindex_at(text, i, char, offset) {
    var final_offset = ((i + 1) * cell_offset) + offset;
    text[final_offset] = char;
}

function get_vindex_at(text, i, offset) {
    var final_offset = ((i + 1) * cell_offset) + offset;
    return text[final_offset];
}



var front = 0;
var back  = 0;
var start = 0;
var elems = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
var elems_i = 0;

var prev_back_column = 292;
var prev_front_column = 292;


function circular_buffer_anim() {
    var anim_element = document.getElementById("c-buffer");
    var anim_text = anim_element.innerHTML.split('');

    if (front == back) {
        for (var i = 0; i < 11; i++) {
            set_cell_at(anim_text, i, ' ', anim_circular_buffer_cell_offset);
        }
        // Pick a new random starting point
        start = Math.floor(Math.random() * 10);
        front = start;
        back  = front;
        elems_i = 0;
    }

    // Pick a random fill direction (0 = front / 1 = back)
    var direction = Math.floor(Math.random() * 2);
    switch (direction) {
    case 0:
        set_cell_at(anim_text, front, elems[elems_i], anim_circular_buffer_cell_offset);
        front = (front + 1) % 11;
        break;
    case 1:
        back = back - 1 < 0 ? 10 : back - 1; // signed ints ftl
        set_cell_at(anim_text, back, elems[elems_i], anim_circular_buffer_cell_offset);
        break;
    }

    // Clear sequence row
    for (var i = 0; i < 11; i++) {
        set_cell_at(anim_text, i, '   ', anim_circular_buffer_vindex_offset);
    }

    // Enumerate elements
    var ri = back;
    var vi = 0;
    do {
        set_cell_at(anim_text, ri, vi.toString(), anim_circular_buffer_vindex_offset);
        ri = (ri + 1) % 11;
        vi++;
    } while (ri != front);

    // clear columns
    for (var i = 0; i <= 10; i++) {
        insert_column(anim_text, "   ", 292 + (i * 4));
    }

    var real_front = front - 1 < 0 ? 10 : front - 1;

    insert_column(anim_text, "^│t", 292 + (real_front * 4));
    prev_front_column = 292 + (real_front * 4);

    insert_column(anim_text, "^│h", 292 + (back * 4));
    prev_back_column = 292 + (back * 4);

    elems_i++;
    anim_element.innerHTML = anim_text.join('');
}


var pointer_start = 211;
var index_start   = 314;
var last_column   = 0;

function anim_virtual() {
    var anim_element = document.getElementById("anim-virtual");
    var anim_text = anim_element.innerHTML.split('');

    insert_column(anim_text, "  ", pointer_start + (4 * last_column));
    insert_row(anim_text, "                                                 ", index_start);

    var vindex = Math.floor(Math.random() * 1000);
    last_column = vindex % 11;

    insert_column(anim_text, "^| ", pointer_start + (4 * last_column));
    insert_row(anim_text, vindex.toString(), index_start + (4 * last_column));

    anim_element.innerHTML = anim_text.join('');
}
    

var bin_cycle_vindex = 0;

const bin_vindex_start = 1;
const bin_result_start = 21;
const dec_vindex_start = 108;
const dec_result_start = 128;


function to_pretty_binary(n) {
    var bin_base = ['0','0','0','0','0','0','0','0'];
    var bin = n.toString(2);

    for (var i = bin_base.length, j = bin.length;
        i >= 0 && j >= 0;
        i--, j--)
    {
        bin_base[i] = bin.charAt(j);
    }
    return bin_base.join(' ').trim();
}


function binary_cycle() {
    var anim_element = document.getElementById("binary-cycle");
    var anim_text = anim_element.innerHTML.split('');
    
    insert_row(anim_text, bin_cycle_vindex.toString(), bin_result_start);

    var result = bin_cycle_vindex & 15;

    if (result == 0) {
        insert_row(anim_text, "  ", dec_result_start);
    }
    insert_row(anim_text, result.toString(), dec_result_start);

    insert_row(anim_text, to_pretty_binary(bin_cycle_vindex), bin_vindex_start);
    insert_row(anim_text, to_pretty_binary(result), dec_vindex_start);
    

    bin_cycle_vindex++;    
    if (bin_cycle_vindex > 255) {
        bin_cycle_vindex = 0;
        insert_row(anim_text, "   ", bin_result_start);
    }

    anim_element.innerHTML = anim_text.join('');
}

var start_time = Date.now();
var delta_time = 0;

var bin_start_time = start_time;
var bin_delta_time = 0;


function next_frame() {
    delta_time = Date.now() - start_time;
    bin_delta_time = Date.now() - bin_start_time;

    // binary cycle tick
    if (bin_delta_time >= 300) {
        binary_cycle();
        bin_start_time += bin_delta_time;
        bin_delta_time = 0;
    }

    // default tick
    if (delta_time >= (800)) {
        circular_buffer_anim();
        anim_virtual();

        start_time += delta_time;
        delta_time = 0;
    }
    window.requestAnimationFrame(next_frame);
}

window.requestAnimationFrame(next_frame);
</script>
