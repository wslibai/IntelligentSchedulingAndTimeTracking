(function () {

	let action = new PlugIn.Action(async function(selection, sender){
		try {
			const lib=this.libTimer
			let jobs=preferences.read("jobs")
			if (jobs===null || jobs.length===0){
				let errMessage="无待分配时间任务，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。"	
				throw new Error(errMessage)
			}
			
			let i=0
			let task
			console.log(`[timeArrangement]当前所有jobs记录：`)
			for (let t of jobs){
				let task=Task.byIdentifier(t.taskId)
				t.obj=task //恢复以JSON形式保存到preferences后丢失的对象引用
				t.parent=task.parent
				t.containingProject=task.containingProject
				t.tags=task.tags
				let message=`job`+lib.getRecordStr(i,t,`taskName`)
				console.log(message)	
				i++
			}
			
			let msg=``
			let unArrangementJobs=jobs.filter(j=>j.scheduleStatus===0)
			if (unArrangementJobs.length>0){//刚运行完动作taskScheduling后
				lib.selectModeAndRunTimeArrangement(unArrangementJobs)
			}else{
				let canArrangementJobs=jobs.filter(j=>(j.scheduleStatus===1 || j.scheduleStatus===2))
				if (canArrangementJobs.length>0){//尚未进行tomatoTiming的可重分配任务
					msg=`有任务分配过时间但未执行，需要重新分配时间吗？\n`
				}
				let inDoingJobs=jobs.filter(j=>j.scheduleStatus===3)
				if (inDoingJobs.length>0){//正在执行中的任务
					msg+="有任务处于执行中，未正常结束，该任务可能有部分执行时间数据未更新（可忽略）。\n"		
				}
				if (msg!==``){
					msg+=`\n是否要忽略以上问题，对任务重新进行时间分配？`
					let alert = new Alert('重新分配时间确认？', msg);
					alert.addOption('重分配');
					alert.addOption('不分配');
					const alertPromise = alert.show();
					alertPromise.then(buttonIndex => {
						switch (buttonIndex) {
							case 0:
								lib.cleanJobPlanTime(jobs)
								tomatoJobs=[]
								preferences.write("tomatoJobs",tomatoJobs)
								lib.selectModeAndRunTimeArrangement(unArrangementJobs)
								break
						}
					})				
				}

				let doneJobs=jobs.filter(j=>j.scheduleStatus===4)
				if (doneJobs.length>0){//已完成任务
					let errMessage="现有调度任务已全部执行完毕，请先从自动化菜单的Smart Scheduling and Timing子菜单运行task scheduling动作。"	
					throw new Error(errMessage)	
				}
	
			}
		}
		catch(err){
			new Alert(err.name, err.message).show()
		}
	});
	
	action.validate = function(selection, sender){
		return (tomatoTracker && !tomatoTracker.timer)
	};
	
	return action;
})()