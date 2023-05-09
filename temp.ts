export const submitChargingResult = async (req, res: IResponse) => {
    const { userId } = req;
    try {
        const request = await chargingRequest
            .findOne({
                userId: userId,
                status: ChargingRequestStatus.charging,
            })
            .exec();

        if (!request) {
            console.error("active charging request not found");
            throw new Error("active charging request not found");
        }

        const pile = await chargingPiles
            .findOne({
                userId: userId,
                "queue.requestId": request.requestId,
            })
            .exec();

        if (!pile) {
            console.error("charging pile not found");
            throw new Error("charging pile not found");
        }

        // Generate charging record details
        const endTime = getDate();
        const startTime = request.requestTime;
        const chargingTime = (endTime.getTime() - startTime.getTime()) / 1000;
        const volume = chargingTime * pile.chargingPower > request.batteryAmount ? request.batteryAmount : chargingTime * pile.chargingPower;

        // TODO: Implement dynamic pricing based on time. For now, use a fixed rate of 0.5 yuan/KWh
        const chargingFee = volume * 0.5;
        const serviceFee = volume * 0.8;
        const totalFee = chargingFee + serviceFee;
        const orderId = "CD" + getDate().getTime().toString(); // Generate order ID based on timestamp

        const responseData: ChargingResponseData = {
            chargingFee: +chargingFee.toFixed(2),
            chargingPileId: pile.chargingPileId,
            chargingTime,
            createTime: startTime,
            endTime,
            orderId,
            serviceFee: +serviceFee.toFixed(2),
            startTime,
            time: new Date().getTime().toString(),
            totalFee: +totalFee.toFixed(2),
            userId: userId,
            volume: +request.batteryAmount.toFixed(2),
        };

        // Create new record in chargingRecord, update chargingRequest, and update chargingPiles by removing requestId from queue
        await Promise.all([
            chargingRecord.create({
                userId: userId,
                recordId: orderId,
                chargingPileId: pile.chargingPileId,
                startTime: startTime,
                endTime: endTime,
                volume: volume,
                chargingFee: chargingFee,
                serviceFee: serviceFee,
                totalFee: totalFee,
            }),
            chargingRequest.updateOne(
                { requestId: request.requestId },
                { $set: { status: ChargingRequestStatus.finished } }
            ),
            chargingPiles.updateOne(
                { chargingPileId: pile.chargingPileId },
                { $pull: { queue: { requestId: request.requestId } } } // Use $pull instead of $pop to remove specific requestId from the queue
            ),
        ]);

        res.json({
            code: 1,
            message: "success",
            data: responseData,
        });
    } catch (error) {
        console.error(error);
        res.json({
            code: -1,
            message:
                "error while submitting charging request. " + error.message,
        });
   
